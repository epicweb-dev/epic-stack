import {
	json,
	redirect,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { prisma } from '~/utils/db.server'
import { sendEmail } from '~/utils/email.server'
import { decrypt, encrypt } from '~/utils/encryption.server'
import {
	Button,
	Field,
	getFieldsFromSchema,
	preprocessFormData,
	useForm,
} from '~/utils/forms'
import { getDomainUrl } from '~/utils/misc.server'
import { commitSession, getSession } from '~/utils/session.server'
import { emailSchema } from '~/utils/user-validation'

export const onboardingEmailSessionKey = 'onboardingToken'
const onboardingTokenQueryParam = 'token'
const tokenType = 'onboarding'

const SignupSchema = z.object({
	email: emailSchema.refine(
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

export async function loader({ request }: DataFunctionArgs) {
	const onboardingTokenString = new URL(request.url).searchParams.get(
		onboardingTokenQueryParam,
	)
	if (onboardingTokenString) {
		const token = JSON.parse(decrypt(onboardingTokenString))
		if (token.type === tokenType && token.payload?.email) {
			const session = await getSession(request.headers.get('cookie'))
			session.set(onboardingEmailSessionKey, token.payload.email)
			return redirect('/onboarding', {
				headers: {
					'Set-Cookie': await commitSession(session),
				},
			})
		} else {
			return redirect('/signup')
		}
	}
	return json({ fields: getFieldsFromSchema(SignupSchema) })
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const result = await SignupSchema.safeParseAsync(
		preprocessFormData(formData, SignupSchema),
	)
	if (!result.success) {
		return json(
			{
				status: 'error',
				errors: result.error.flatten(),
			} as const,
			{ status: 400 },
		)
	}
	const { email } = result.data

	const onboardingToken = encrypt(
		JSON.stringify({ type: tokenType, payload: { email } }),
	)
	const onboardingUrl = new URL(`${getDomainUrl(request)}/signup`)
	onboardingUrl.searchParams.set(onboardingTokenQueryParam, onboardingToken)

	const response = await sendEmail({
		to: email,
		subject: `Welcome to Rocket Rental!`,
		text: `Please open this URL: ${onboardingUrl}`,
		html: `
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html>
			<head>
				<meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
			</head>
			<body>
				<h1>Welcome to Rocket Rental!</h1>
				<p>Click the link below to get started:</p>
				<a href="${onboardingUrl}">${onboardingUrl}</a>
			</body>
		`,
	})

	if (response.ok) {
		return json({ status: 'success', errors: null } as const)
	} else {
		return json(
			{
				status: 'error',
				errors: {
					formErrors: ['Email not sent successfully'],
					fieldErrors: {},
				},
			} as const,
			{ status: 500 },
		)
	}
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Sign Up | Rocket Rental' }]
}

export default function SignupRoute() {
	const data = useLoaderData<typeof loader>()
	const signupFetcher = useFetcher<typeof action>()
	const { form, fields } = useForm({
		name: 'signup-form',
		fieldMetadatas: data.fields,
		errors: signupFetcher.data?.errors,
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
							labelProps={{ ...fields.email.labelProps, children: 'Email' }}
							inputProps={{ ...fields.email.props, type: 'email' }}
						/>
						{form.errorUI}
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
