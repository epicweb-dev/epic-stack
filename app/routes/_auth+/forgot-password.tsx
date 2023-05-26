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
import { prisma } from '~/utils/db.server.ts'
import { sendEmail } from '~/utils/email.server.ts'
import { decrypt, encrypt } from '~/utils/encryption.server.ts'
import { Button, ErrorList, Field } from '~/utils/forms.tsx'
import { getDomainUrl } from '~/utils/misc.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { emailSchema, usernameSchema } from '~/utils/user-validation.ts'

export const resetPasswordSessionKey = 'resetPasswordToken'
const resetPasswordTokenQueryParam = 'token'
const tokenType = 'forgot-password'

const forgotPasswordSchema = z.object({
	usernameOrEmail: z.union([emailSchema, usernameSchema]),
})

const tokenSchema = z.object({
	type: z.literal(tokenType),
	payload: z.object({
		username: usernameSchema,
	}),
})

export async function loader({ request }: DataFunctionArgs) {
	const resetPasswordTokenString = new URL(request.url).searchParams.get(
		resetPasswordTokenQueryParam,
	)
	if (resetPasswordTokenString) {
		const submission = tokenSchema.safeParse(
			JSON.parse(decrypt(resetPasswordTokenString)),
		)
		if (!submission.success) return redirect('/signup')
		const token = submission.data

		const session = await getSession(request.headers.get('cookie'))
		session.set(resetPasswordSessionKey, token.payload.username)
		return redirect('/reset-password', {
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		})
	}

	return json({})
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: forgotPasswordSchema,
		acceptMultipleErrors: () => true,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	const { usernameOrEmail } = submission.value

	const user = await prisma.user.findFirst({
		where: { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
		select: { email: true, username: true },
	})
	if (user) {
		void sendPasswordResetEmail({ request, user })
	}

	return json({ status: 'success', submission } as const)
}

async function sendPasswordResetEmail({
	request,
	user,
}: {
	request: Request
	user: { email: string; username: string }
}) {
	const resetPasswordToken = encrypt(
		JSON.stringify({ type: tokenType, payload: { username: user.username } }),
	)
	const resetPasswordUrl = new URL(`${getDomainUrl(request)}/forgot-password`)
	resetPasswordUrl.searchParams.set(
		resetPasswordTokenQueryParam,
		resetPasswordToken,
	)

	await sendEmail({
		to: user.email,
		subject: `Epic Notes Password Reset`,
		text: `Please open this URL: ${resetPasswordUrl}`,
		html: `
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html>
			<head>
				<meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
			</head>
			<body>
				<h1>Reset your Epic Notes password.</h1>
				<p>Click the link below to reset the Epic Notes password for ${user.username}.</p>
				<a href="${resetPasswordUrl}">${resetPasswordUrl}</a>
			</body>
		</html>
		`,
	})
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Password Recovery for Epic Notes' }]
}

export default function SignupRoute() {
	const forgotPassword = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'forgot-password-form',
		constraint: getFieldsetConstraint(forgotPasswordSchema),
		lastSubmission: forgotPassword.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: forgotPasswordSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container mx-auto pb-32 pt-20">
			<div className="flex flex-col justify-center">
				{forgotPassword.data?.status === 'success' ? (
					<div className="text-center">
						<img src="" alt="" />
						<h1 className="mt-44 text-h1">Check your email</h1>
						<p className="mt-3 text-body-md text-night-200">
							Instructions have been sent to the email address on file.
						</p>
					</div>
				) : (
					<>
						<div className="text-center">
							<h1 className="text-h1">Forgot Password</h1>
							<p className="mt-3 text-body-md text-night-200">
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
									inputProps={conform.input(fields.usernameOrEmail)}
									errors={fields.usernameOrEmail.errors}
								/>
							</div>
							<ErrorList errors={form.errors} id={form.errorId} />

							<div className="mt-6">
								<Button
									className="w-full"
									size="md"
									variant="primary"
									status={
										forgotPassword.state === 'submitting'
											? 'pending'
											: forgotPassword.data?.status ?? 'idle'
									}
									type="submit"
									disabled={forgotPassword.state !== 'idle'}
								>
									Recover password
								</Button>
							</div>
						</forgotPassword.Form>
					</>
				)}
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
