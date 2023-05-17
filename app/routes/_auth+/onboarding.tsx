import { useForm } from '@conform-to/react'
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
	useLoaderData,
	useNavigation,
	useSearchParams,
} from '@remix-run/react'
import { z } from 'zod'
import { Spacer } from '~/components/spacer.tsx'
import { authenticator, createUser } from '~/utils/auth.server.ts'
import { Button, CheckboxField, ErrorList, Field } from '~/utils/forms.tsx'
import { safeRedirect } from '~/utils/misc.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import {
	nameSchema,
	passwordSchema,
	usernameSchema,
} from '~/utils/user-validation.ts'
import { onboardingEmailSessionKey } from './signup.tsx'

const OnboardingFormSchema = z
	.object({
		username: usernameSchema,
		name: nameSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema,
		agreeToTermsOfServiceAndPrivacyPolicy: z
			.preprocess(value => value === 'on', z.boolean())
			.refine(val => val, {
				message: 'You must agree to the terms of service and privacy policy',
			}),
		agreeToMailingList: z.preprocess(value => value === 'on', z.boolean()),
		remember: z.preprocess(value => value === 'on', z.boolean()),
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
		{ formError: error?.message },
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
	const submission = parse(formData, {
		schema: OnboardingFormSchema,
		acceptMultipleErrors: () => true,
	})
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	const {
		username,
		name,
		password,
		// TODO: add user to mailing list if they agreed to it
		// agreeToMailingList,
		remember,
		redirectTo,
	} = submission.value

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
	return [{ title: 'Setup Epic Notes Account' }]
}

export default function OnboardingPage() {
	const [searchParams] = useSearchParams()
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()

	const [form, fields] = useForm({
		id: 'onboarding',
		constraint: getFieldsetConstraint(OnboardingFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: OnboardingFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const redirectTo = searchParams.get('redirectTo') || '/'

	return (
		<div className="container mx-auto flex min-h-full flex-col justify-center pb-32 pt-20">
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
						labelProps={{ htmlFor: fields.username.id, children: 'Username' }}
						inputProps={{
							...fields.username,
							autoComplete: 'username',
							autoFocus: true,
						}}
						errors={fields.username.errors}
					/>
					<Field
						labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
						inputProps={{
							...fields.name,
							autoComplete: 'name',
							autoFocus: true,
						}}
						errors={fields.name.errors}
					/>
					<Field
						labelProps={{ htmlFor: fields.password.id, children: 'Password' }}
						inputProps={{
							...fields.password,
							autoComplete: 'new-password',
							type: 'password',
						}}
						errors={fields.password.errors}
					/>

					<Field
						labelProps={{
							htmlFor: fields.confirmPassword.id,
							children: 'Confirm Password',
						}}
						inputProps={{
							...fields.confirmPassword,
							autoComplete: 'new-password',
							type: 'password',
						}}
						errors={fields.confirmPassword.errors}
					/>

					<CheckboxField
						labelProps={{
							htmlFor: fields.agreeToTermsOfServiceAndPrivacyPolicy.id,
							children:
								'Do you agree to our Terms of Service and Privacy Policy?',
						}}
						buttonProps={fields.agreeToTermsOfServiceAndPrivacyPolicy}
						errors={fields.agreeToTermsOfServiceAndPrivacyPolicy.errors}
					/>

					<CheckboxField
						labelProps={{
							htmlFor: fields.agreeToMailingList.id,
							children:
								'Would you like to receive special discounts and offers?',
						}}
						buttonProps={fields.agreeToMailingList}
						errors={fields.agreeToMailingList.errors}
					/>

					<CheckboxField
						labelProps={{
							htmlFor: fields.remember.id,
							children: 'Remember me',
						}}
						buttonProps={fields.remember}
						errors={fields.remember.errors}
					/>

					<input {...fields.redirectTo} type="hidden" value={redirectTo} />

					<ErrorList errors={data.formError ? [data.formError] : []} />
					<ErrorList errors={form.errors} id={form.errorId} />

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
