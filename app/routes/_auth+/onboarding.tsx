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
	useLoaderData,
	useNavigation,
	useSearchParams,
} from '@remix-run/react'
import { z } from 'zod'
import { Spacer } from '~/components/spacer'
import { authenticator, createUser } from '~/utils/auth.server'
import {
	Button,
	CheckboxField,
	Field,
	getFieldsFromSchema,
	preprocessFormData,
	useForm,
} from '~/utils/forms'
import { safeRedirect } from '~/utils/misc'
import { commitSession, getSession } from '~/utils/session.server'
import {
	nameSchema,
	passwordSchema,
	usernameSchema,
} from '~/utils/user-validation'
import { onboardingEmailSessionKey } from './signup'

const OnboardingFormSchema = z
	.object({
		username: usernameSchema,
		name: nameSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema,
		agreeToTermsOfServiceAndPrivacyPolicy: z.boolean().refine(val => val, {
			message: 'You must agree to the terms of service and privacy policy',
		}),
		agreeToMailingList: z.boolean(),
		remember: z.boolean(),
		redirectTo: z.string().optional(),
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				path: ['confirmPassword'],
				code: 'custom',
				message: 'The passwords did not match',
			})
		}
	})

export async function loader({ request }: DataFunctionArgs) {
	await authenticator.isAuthenticated(request, {
		successRedirect: '/',
	})
	const session = await getSession(request.headers.get('cookie'))
	const error = session.get(authenticator.sessionErrorKey)
	const onboardingEmail = session.get(onboardingEmailSessionKey)
	if (typeof onboardingEmail !== 'string' || !onboardingEmail) {
		return redirect('/signup')
	}
	return json(
		{
			formError: error?.message,
			onboardingEmail,
			fieldMetadatas: getFieldsFromSchema(OnboardingFormSchema),
		},
		{
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		},
	)
}

export async function action({ request }: DataFunctionArgs) {
	const session = await getSession(request.headers.get('cookie'))
	const email = session.get(onboardingEmailSessionKey)
	if (typeof email !== 'string' || !email) {
		return redirect('/signup')
	}

	const formData = await request.formData()
	const result = OnboardingFormSchema.safeParse(
		preprocessFormData(formData, OnboardingFormSchema),
	)
	if (!result.success) {
		return json({ status: 'error', errors: result.error.flatten() } as const, {
			status: 400,
		})
	}
	const {
		username,
		name,
		password,
		// TODO: add user to mailing list if they agreed to it
		// agreeToMailingList,
		remember,
		redirectTo,
	} = result.data

	const user = await createUser({ email, username, password, name })
	session.set(authenticator.sessionKey, user.id)
	session.unset(onboardingEmailSessionKey)

	const newCookie = await commitSession(session, {
		maxAge: remember
			? 60 * 60 * 24 * 7 // 7 days
			: undefined,
	})
	return redirect(safeRedirect(redirectTo, '/'), {
		headers: { 'Set-Cookie': newCookie },
	})
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Setup Rocket Rental Account' }]
}

export default function OnboardingPage() {
	const [searchParams] = useSearchParams()
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()
	const { form, fields } = useForm({
		name: 'onboarding',
		fieldMetadatas: data.fieldMetadatas,
		errors: actionData?.errors,
	})

	const redirectTo = searchParams.get('redirectTo') || '/'

	return (
		<div className="container mx-auto flex min-h-full flex-col justify-center pt-20 pb-32">
			<div className="mx-auto w-full max-w-lg">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome aboard!</h1>
					<p className="text-body-md text-night-200">
						Please enter your details.
					</p>
				</div>
				<Spacer size="xs" />
				<Form
					method="POST"
					className="mx-auto min-w-[368px] max-w-sm"
					{...form.props}
				>
					<Field
						labelProps={{ ...fields.username.labelProps, children: 'Username' }}
						inputProps={{
							...fields.username.props,
							autoComplete: 'username',
							autoFocus: true,
						}}
						errors={fields.username.errors}
					/>
					<Field
						labelProps={{ ...fields.name.labelProps, children: 'Name' }}
						inputProps={{
							...fields.name.props,
							autoComplete: 'name',
							autoFocus: true,
						}}
						errors={fields.name.errors}
					/>
					<Field
						labelProps={{ ...fields.password.labelProps, children: 'Password' }}
						inputProps={{
							...fields.password.props,
							autoComplete: 'new-password',
							type: 'password',
						}}
						errors={fields.password.errors}
					/>

					<Field
						labelProps={{
							...fields.confirmPassword.labelProps,
							children: 'Confirm Password',
						}}
						inputProps={{
							...fields.confirmPassword.props,
							autoComplete: 'new-password',
							type: 'password',
						}}
						errors={fields.confirmPassword.errors}
					/>

					<CheckboxField
						labelProps={{
							...fields.agreeToTermsOfServiceAndPrivacyPolicy.labelProps,
							children:
								'Do you agree to our Terms of Service and Privacy Policy?',
						}}
						buttonProps={fields.agreeToTermsOfServiceAndPrivacyPolicy.props}
						errors={fields.agreeToTermsOfServiceAndPrivacyPolicy.errors}
					/>

					<CheckboxField
						labelProps={{
							...fields.agreeToMailingList.labelProps,
							children:
								'Would you like to receive special discounts and offers?',
						}}
						buttonProps={fields.agreeToMailingList.props}
						errors={fields.agreeToMailingList.errors}
					/>

					<CheckboxField
						labelProps={{
							...fields.remember.labelProps,
							children: 'Remember me',
						}}
						buttonProps={fields.remember.props}
						errors={fields.remember.errors}
					/>

					<input
						{...fields.redirectTo.props}
						type="hidden"
						value={redirectTo}
					/>

					{form.errorUI}

					<div className="flex items-center justify-between gap-6">
						<Button
							className="w-full"
							size="md"
							variant="primary"
							status={
								navigation.state === 'submitting' &&
								navigation.formAction === formAction &&
								navigation.formMethod === 'POST'
									? 'pending'
									: actionData?.status ?? 'idle'
							}
							type="submit"
							disabled={navigation.state !== 'idle'}
						>
							Create an account
						</Button>
					</div>
				</Form>
			</div>
		</div>
	)
}
