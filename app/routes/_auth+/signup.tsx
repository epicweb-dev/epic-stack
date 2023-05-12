import {
	json,
	redirect,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { prisma } from '~/utils/db.server'
import { sendEmail } from '~/utils/email.server'
import { decrypt, encrypt } from '~/utils/encryption.server'
import {
	Button,
	ErrorList,
	Field,
} from '~/utils/forms'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { getDomainUrl } from '~/utils/misc.server'
import { commitSession, getSession } from '~/utils/session.server'
import { emailSchema } from '~/utils/user-validation'

export const onboardingEmailSessionKey = 'onboardingToken'
const onboardingTokenQueryParam = 'token'
const tokenType = 'onboarding'

function createSchema(
	intent: string = "",
	constraints: {
		isEmailUnique: (email: string) => Promise<boolean>;
	} = {
		isEmailUnique: async () => true,
	},
) {
	const signupSchema = z.object({
		email: emailSchema
			.superRefine((email, ctx) => {
				if (intent !== 'validate/email' && intent !== 'submit') {
					// Validate only when the email field is changed or when submitting
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: conform.VALIDATION_SKIPPED,
					});
				} else if (typeof constraints.isEmailUnique === 'undefined') {
					// Validate only if the constraint is defined
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: conform.VALIDATION_UNDEFINED,
					});
				} else {
					// Tell zod this is an async validation by returning the promise
					return constraints.isEmailUnique(email).then((isUnique) => {
						if (isUnique) {
							return;
						}

						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: 'Email is already used',
						});
					});
				}
			})
			.refine(
				async email => {
					const existingUser = await prisma.user.findUnique({
						where: { email },
						select: { id: true },
					})
					return !existingUser
				},
				{ message: 'A user already exists with this email' },
			),
	})
	return signupSchema
}

const tokenSchema = z.object({
	type: z.literal(tokenType),
	payload: z.object({
		email: emailSchema,
	}),
})

export async function loader({ request }: DataFunctionArgs) {
	const onboardingTokenString = new URL(request.url).searchParams.get(
		onboardingTokenQueryParam,
	)
	if (onboardingTokenString) {
		const result = tokenSchema.safeParse(
			JSON.parse(decrypt(onboardingTokenString)),
		)
		if (!result.success) return redirect('/signup')
		const token = result.data

		const session = await getSession(request.headers.get('cookie'))
		session.set(onboardingEmailSessionKey, token.payload.email)
		return redirect('/onboarding', {
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		})
	}
	return json({})
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = await parse(formData, {
		// Retrieve the intent by providing a function instead
		schema: (intent: string) =>
			createSchema(intent, {
				async isEmailUnique(email: string) {
					const existingUser = await prisma.user.findUnique({
						where: { email },
						select: { id: true },
					})
					return !existingUser
				},
			}),
		acceptMultipleErrors: () => true,
		async: true,
	})
	if (!submission.value || submission.intent !== 'submit') {
		return json({
			status: 'error',
			submission,
		} as const)
	}
	const { email } = submission.value

	const onboardingToken = encrypt(
		JSON.stringify({ type: tokenType, payload: { email } }),
	)
	const onboardingUrl = new URL(`${getDomainUrl(request)}/signup`)
	onboardingUrl.searchParams.set(onboardingTokenQueryParam, onboardingToken)

	const response = await sendEmail({
		to: email,
		subject: `Welcome to Epic Notes!`,
		text: `Please open this URL: ${onboardingUrl}`,
		html: `
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html>
			<head>
				<meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
			</head>
			<body>
				<h1>Welcome to Epic Notes!</h1>
				<p>Click the link below to get started:</p>
				<a href="${onboardingUrl}">${onboardingUrl}</a>
			</body>
		`,
	})

	if (response?.ok) {
		return json({ status: 'success', submission } as const)
	} else {
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
	const signupFetcher = useFetcher<typeof action>()
	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(createSchema()),
		lastSubmission: signupFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: createSchema() })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container mx-auto flex flex-col justify-center pb-32 pt-20">
			{signupFetcher.data?.status === 'success' ? (
				<div className="text-center">
					<img src="" alt="" />
					<h1 className="mt-44 text-h1">Great!</h1>
					<p className="mt-3 text-body-md text-night-200">
						Check your email for a link to continue.
					</p>
				</div>
			) : (
				<>
					<div className="text-center">
						<h1 className="text-h1">Let's start your journey!</h1>
						<p className="mt-3 text-body-md text-night-200">
							Please enter your email.
						</p>
					</div>
					<signupFetcher.Form
						method="POST"
						className="mx-auto mt-16 min-w-[368px] max-w-sm"
						{...form.props}
					>
						<Field
							labelProps={{
								htmlFor: fields.email.id,
								children: 'Email',
							}}
							inputProps={fields.email}
							errors={fields.email.errors}
						/>
						<ErrorList errors={form.errors} id={form.errorId} />
						<Button
							className="w-full"
							size="md"
							variant="primary"
							status={
								signupFetcher.state === 'submitting'
									? 'pending'
									: signupFetcher.data?.status ?? 'idle'
							}
							type="submit"
							disabled={signupFetcher.state !== 'idle'}
						>
							Launch
						</Button>
					</signupFetcher.Form>
				</>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
