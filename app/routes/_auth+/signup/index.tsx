import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useFormAction,
	useNavigation,
} from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { prisma } from '~/utils/db.server.ts'
import { sendEmail } from '~/utils/email.server.ts'
import { getDomainUrl } from '~/utils/misc.ts'
import { generateTOTP } from '~/utils/totp.server.ts'
import { emailSchema } from '~/utils/user-validation.ts'
import { SignupEmail } from './email.server.tsx'

export const onboardingOTPQueryParam = 'code'
export const onboardingEmailQueryParam = 'email'
export const verificationType = 'onboarding'

const signupSchema = z.object({
	email: emailSchema,
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = await parse(formData, {
		schema: signupSchema.superRefine(async (data, ctx) => {
			const existingUser = await prisma.user.findUnique({
				where: { email: data.email },
				select: { id: true },
			})
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this email',
				})
				return
			}
		}),
		acceptMultipleErrors: () => true,
		async: true,
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
	const { email } = submission.value

	const thirtyMinutesInSeconds = 30 * 60
	const { otp, secret, algorithm, period, digits } = generateTOTP({
		algorithm: 'SHA256',
		period: thirtyMinutesInSeconds,
	})
	// delete old verifications. Users should not have more than one verification
	// of a specific type for a specific target at a time.
	await prisma.verification.deleteMany({
		where: { type: verificationType, target: email },
	})
	await prisma.verification.create({
		data: {
			type: verificationType,
			target: email,
			algorithm,
			secret,
			period,
			digits,
			expiresAt: new Date(Date.now() + period * 1000),
		},
	})
	const onboardingUrl = new URL(`${getDomainUrl(request)}/signup/verify`)
	onboardingUrl.searchParams.set(onboardingEmailQueryParam, email)
	const redirectTo = new URL(onboardingUrl.toString())

	// add the otp to the url we'll email the user.
	onboardingUrl.searchParams.set(onboardingOTPQueryParam, otp)

	const response = await sendEmail({
		to: email,
		subject: `Welcome to Epic Notes!`,
		react: <SignupEmail onboardingUrl={onboardingUrl.toString()} otp={otp} />,
	})

	if (response.status === 'success') {
		return redirect(redirectTo.pathname + redirectTo.search)
	} else {
		submission.error[''] = response.error.message
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 500 },
		)
	}
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Sign Up | Epic Notes' }]
}

export default function SignupRoute() {
	const actionData = useActionData<typeof action>()
	const formAction = useFormAction()
	const navigation = useNavigation()
	const isSubmitting = navigation.formAction === formAction
	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(signupSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			const result = parse(formData, { schema: signupSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Let's start your journey!</h1>
				<p className="mt-3 text-body-md text-muted-foreground">
					Please enter your email.
				</p>
			</div>
			<Form
				method="POST"
				className="mx-auto mt-16 min-w-[368px] max-w-sm"
				{...form.props}
			>
				<Field
					labelProps={{
						htmlFor: fields.email.id,
						children: 'Email',
					}}
					inputProps={{ ...conform.input(fields.email), autoFocus: true }}
					errors={fields.email.errors}
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
				<StatusButton
					className="w-full"
					status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
					type="submit"
					disabled={isSubmitting}
				>
					Submit
				</StatusButton>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
