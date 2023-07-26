import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { sendEmail } from '~/utils/email.server.ts'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { invariant, useIsSubmitting } from '~/utils/misc.tsx'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { emailSchema } from '~/utils/user-validation.ts'
import {
	prepareVerification,
	Verify,
	type VerifyFunctionArgs,
} from '../../resources+/verify.tsx'
import { EmailChangeEmail, EmailChangeNoticeEmail } from './email.server.tsx'
import { shouldRequestTwoFA } from '~/routes/resources+/login.tsx'
import { useUser } from '~/utils/user.ts'

export const newEmailAddressSessionKey = 'new-email-address'

const ChangeEmailSchema = z.object({
	email: emailSchema,
})

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { email: true },
	})
	if (!user) {
		const params = new URLSearchParams({ redirectTo: request.url })
		throw redirectWithToast(`/login?${params}`, {
			title: 'Please Login',
			description: 'You must login first to change your email',
		})
	}
	const shouldReverify = await shouldRequestTwoFA(request)
	return json({ user, shouldReverify })
}

export async function action({ request }: DataFunctionArgs) {
	if (await shouldRequestTwoFA(request)) {
		// looks like they waited too long enter the email
		return redirectWithToast(request.url, {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		})
	}
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = await parse(formData, {
		schema: ChangeEmailSchema.superRefine(async (data, ctx) => {
			const existingUser = await prisma.user.findUnique({
				where: { email: data.email },
			})
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: 'custom',
					message: 'This email is already in use.',
				})
			}
		}),
		async: true,
		acceptMultipleErrors: () => true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	const { otp, redirectTo, verifyUrl } = await prepareVerification({
		period: 10 * 60,
		request,
		target: userId,
		type: 'change-email',
	})

	const response = await sendEmail({
		to: submission.value.email,
		subject: `Epic Notes Email Change Verification`,
		react: <EmailChangeEmail verifyUrl={verifyUrl.toString()} otp={otp} />,
	})

	if (response.status === 'success') {
		const cookieSession = await getSession(request.headers.get('cookie'))
		cookieSession.set(newEmailAddressSessionKey, submission.value.email)
		return redirect(redirectTo.toString(), {
			headers: {
				'Set-Cookie': await commitSession(cookieSession),
			},
		})
	} else {
		submission.error[''] = response.error.message
		return json({ status: 'error', submission } as const, { status: 500 })
	}
}

export async function handleVerification({
	request,
	submission,
}: VerifyFunctionArgs) {
	invariant(submission.value, 'submission.value should be defined by now')

	const cookieSession = await getSession(request.headers.get('Cookie'))
	const newEmail = cookieSession.get(newEmailAddressSessionKey)
	if (!newEmail) {
		submission.error[''] = [
			'You must submit the code on the same device that requested the email change.',
		]
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	const preUpdateUser = await prisma.user.findFirstOrThrow({
		select: { email: true },
		where: { id: submission.value.target },
	})
	const user = await prisma.user.update({
		where: { id: submission.value.target },
		select: { id: true, email: true, username: true },
		data: { email: newEmail },
	})

	cookieSession.unset(newEmailAddressSessionKey)

	void sendEmail({
		to: preUpdateUser.email,
		subject: 'Epic Stack email changed',
		react: <EmailChangeNoticeEmail userId={user.id} />,
	})

	return redirectWithToast(
		'/settings/profile',
		{ title: 'Success', description: 'Your email has been changed.' },
		{ headers: { 'Set-Cookie': await commitSession(cookieSession) } },
	)
}

export default function ChangeEmailIndex() {
	const data = useLoaderData<typeof loader>()
	const user = useUser()
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'change-email-form',
		constraint: getFieldsetConstraint(ChangeEmailSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ChangeEmailSchema })
		},
	})

	const isSubmitting = useIsSubmitting()
	return (
		<div>
			<h1 className="text-h1">Change Email</h1>
			<p>You will receive an email at the new email address to confirm.</p>
			<p>
				An email notice will also be sent to your old address {data.user.email}.
			</p>
			<div className="mx-auto mt-5 max-w-sm">
				{data.shouldReverify ? (
					<>
						<p>Please reverify your account by submitting your 2FA code</p>
						<Verify target={user.id} type="2fa" />
					</>
				) : (
					<Form method="POST" {...form.props}>
						<Field
							labelProps={{ children: 'New Email' }}
							inputProps={conform.input(fields.email)}
							errors={fields.email.errors}
						/>
						<ErrorList id={form.errorId} errors={form.errors} />
						<div>
							<StatusButton
								status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
							>
								Send Confirmation
							</StatusButton>
						</div>
					</Form>
				)}
			</div>
		</div>
	)
}
