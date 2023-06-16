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
import { Button, ErrorList, Field } from '~/utils/forms.tsx'
import { getDomainUrl } from '~/utils/misc.server.ts'
import { generateTOTP } from '~/utils/totp.server.ts'
import { emailSchema, usernameSchema } from '~/utils/user-validation.ts'

export const forgotPasswordOTPQueryParam = 'code'
export const forgotPasswordTargetQueryParam = 'usernameOrEmail'
export const verificationType = 'forgot-password'

const forgotPasswordSchema = z.object({
	usernameOrEmail: z.union([emailSchema, usernameSchema]),
})

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

	const resetPasswordUrl = new URL(
		`${getDomainUrl(request)}/forgot-password/verify`,
	)
	resetPasswordUrl.searchParams.set(
		forgotPasswordTargetQueryParam,
		usernameOrEmail,
	)
	const redirectTo = new URL(resetPasswordUrl.toString())

	const user = await prisma.user.findFirst({
		where: { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
		select: { email: true, username: true },
	})
	if (user) {
		// fire and forget to avoid timing attacks

		const tenMinutesInSeconds = 10 * 60
		// using username or email as the verification target allows us to
		// avoid leaking whether a username or email is registered. It also
		// allows a user who forgot one to use the other to reset their password.
		// And displaying what the user provided rather than the other ensures we
		// don't leak the association between the two.
		const target = usernameOrEmail
		const { otp, secret, algorithm, period, digits } = generateTOTP({
			algorithm: 'sha256',
			period: tenMinutesInSeconds,
		})
		// delete old verifications. Users should not have more than one verification
		// of a specific type for a specific target at a time.
		await prisma.verification.deleteMany({
			where: { type: verificationType, target },
		})
		await prisma.verification.create({
			data: {
				type: verificationType,
				target,
				algorithm,
				secret,
				period,
				digits,
				expiresAt: new Date(Date.now() + period * 1000),
			},
		})

		// add the otp to the url we'll email the user.
		resetPasswordUrl.searchParams.set(forgotPasswordOTPQueryParam, otp)

		await sendEmail({
			to: user.email,
			subject: `Epic Notes Password Reset`,
			text: `
Welcome to Epic Notes!
Here's your verification code: ${otp}
Or you can open this URL: ${resetPasswordUrl}
			`.trim(),
			html: `
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
			<html>
				<head>
					<meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
				</head>
				<body>
					<h1>Reset your Epic Notes password for ${user.username}.</h1>
					<p>Here's your verification code: <strong>${otp}</strong></p>
					<p>Or click this link:</p>
					<a href="${resetPasswordUrl}">${resetPasswordUrl}</a>
				</body>
			</html>
		`,
		})
	}

	return redirect(redirectTo.pathname + redirectTo.search)
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Password Recovery for Epic Notes' }]
}

export default function ForgotPasswordRoute() {
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
				<div className="text-center">
					<h1 className="text-h1">Forgot Password</h1>
					<p className="text-muted-200 mt-3 text-body-md">
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
