import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import {
	type VerifyFunctionArgs,
	getRedirectToUrl,
	prepareVerification,
} from '~/routes/resources+/verify.tsx'
import { prisma } from '~/utils/db.server.ts'
import { sendEmail } from '~/utils/email.server.ts'
import { invariant, invariantResponse } from '~/utils/misc.tsx'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { emailSchema, usernameSchema } from '~/utils/user-validation.ts'
import { resetPasswordUsernameSessionKey } from '../reset-password.tsx'
import { ForgotPasswordEmail } from './email.server.tsx'

const ForgotPasswordSchema = z.object({
	usernameOrEmail: z.union([emailSchema, usernameSchema]),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = await parse(formData, {
		schema: ForgotPasswordSchema.superRefine(async (data, ctx) => {
			const user = await prisma.user.findFirst({
				where: {
					OR: [
						{ email: data.usernameOrEmail },
						{ username: data.usernameOrEmail },
					],
				},
				select: { id: true },
			})
			if (!user) {
				ctx.addIssue({
					path: ['usernameOrEmail'],
					code: z.ZodIssueCode.custom,
					message: 'No user exists with this username or email',
				})
				return
			}
		}),
		async: true,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	const { usernameOrEmail } = submission.value
	const redirectTo = getRedirectToUrl({
		request,
		type: 'forgot-password',
		target: usernameOrEmail,
	})

	const user = await prisma.user.findFirst({
		where: { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
		select: { email: true, username: true },
	})
	invariantResponse(user, 'User should exist')

	const { verifyUrl, otp } = await prepareVerification({
		period: 10 * 60,
		request,
		type: 'forgot-password',
		target: usernameOrEmail,
	})

	const response = await sendEmail({
		to: user.email,
		subject: `Epic Notes Password Reset`,
		react: (
			<ForgotPasswordEmail onboardingUrl={verifyUrl.toString()} otp={otp} />
		),
	})

	if (response.status === 'success') {
		return redirect(redirectTo.toString())
	} else {
		submission.error[''] = [response.error.message]
		return json({ status: 'error', submission } as const, { status: 500 })
	}
}

export async function handleVerification({
	request,
	submission,
}: VerifyFunctionArgs) {
	invariant(submission.value, 'submission.value should be defined by now')
	const target = submission.value.target
	const user = await prisma.user.findFirst({
		where: { OR: [{ email: target }, { username: target }] },
		select: { email: true, username: true },
	})
	// we don't want to say the user is not found if the email is not found
	// because that would allow an attacker to check if an email is registered
	invariantResponse(user, 'Invalid code')

	const session = await getSession(request.headers.get('cookie'))
	session.set(resetPasswordUsernameSessionKey, user.username)
	return redirect('/reset-password', {
		headers: { 'Set-Cookie': await commitSession(session) },
	})
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Password Recovery for Epic Notes' }]
}

export default function ForgotPasswordRoute() {
	const forgotPassword = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'forgot-password-form',
		constraint: getFieldsetConstraint(ForgotPasswordSchema),
		lastSubmission: forgotPassword.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ForgotPasswordSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container pb-32 pt-20">
			<div className="flex flex-col justify-center">
				<div className="text-center">
					<h1 className="text-h1">Forgot Password</h1>
					<p className="mt-3 text-body-md text-muted-foreground">
						No worries, we'll send you reset instructions.
					</p>
				</div>
				<forgotPassword.Form
					method="POST"
					{...form.props}
					className="mx-auto mt-16 min-w-[368px] max-w-sm"
				>
					<div>
						<Field
							labelProps={{
								htmlFor: fields.usernameOrEmail.id,
								children: 'Username or Email',
							}}
							inputProps={{
								autoFocus: true,
								...conform.input(fields.usernameOrEmail),
							}}
							errors={fields.usernameOrEmail.errors}
						/>
					</div>
					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="mt-6">
						<StatusButton
							className="w-full"
							status={
								forgotPassword.state === 'submitting'
									? 'pending'
									: forgotPassword.data?.status ?? 'idle'
							}
							type="submit"
							disabled={forgotPassword.state !== 'idle'}
						>
							Recover password
						</StatusButton>
					</div>
				</forgotPassword.Form>
				<Link to="/login" className="mt-11 text-center text-body-sm font-bold">
					Back to Login
				</Link>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
