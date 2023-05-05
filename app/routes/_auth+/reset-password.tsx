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
} from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { authenticator, resetUserPassword } from '~/utils/auth.server'
import {
	Button,
	Field,
	getFieldsFromSchema,
	preprocessFormData,
	useForm,
} from '~/utils/forms'
import { commitSession, getSession } from '~/utils/session.server'
import { passwordSchema } from '~/utils/user-validation'
import { resetPasswordSessionKey } from './forgot-password'

const ResetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: passwordSchema,
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
	const resetPasswordUsername = session.get(resetPasswordSessionKey)
	if (typeof resetPasswordUsername !== 'string' || !resetPasswordUsername) {
		return redirect('/login')
	}
	return json(
		{
			formError: error?.message,
			resetPasswordUsername,
			fieldMetadatas: getFieldsFromSchema(ResetPasswordSchema),
		},
		{
			headers: { 'Set-Cookie': await commitSession(session) },
		},
	)
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const result = ResetPasswordSchema.safeParse(
		preprocessFormData(formData, ResetPasswordSchema),
	)
	if (!result.success) {
		return json({ status: 'error', errors: result.error.flatten() } as const, {
			status: 400,
		})
	}

	const { password } = result.data

	const session = await getSession(request.headers.get('cookie'))
	const username = session.get(resetPasswordSessionKey)
	if (typeof username !== 'string' || !username) {
		return redirect('/login')
	}
	await resetUserPassword({ username, password })
	session.unset(resetPasswordSessionKey)
	return redirect('/login', {
		headers: { 'Set-Cookie': await commitSession(session) },
	})
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Reset Password | Epic Notes' }]
}

export default function ResetPasswordPage() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const formAction = useFormAction()
	const navigation = useNavigation()

	const { form, fields } = useForm({
		name: 'reset-password',
		errors: actionData?.errors,
		fieldMetadatas: data.fieldMetadatas,
	})

	return (
		<div className="container mx-auto flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Password Reset</h1>
				<p className="mt-3 text-body-md text-night-200">
					Hi, {data.resetPasswordUsername}. No worries. It happens all the time.
				</p>
			</div>
			<Form
				method="POST"
				className="mx-auto mt-16 min-w-[368px] max-w-sm"
				{...form.props}
			>
				<Field
					labelProps={{
						...fields.password.labelProps,
						children: 'New Password',
					}}
					inputProps={{
						...fields.password.props,
						type: 'password',
						autoComplete: 'new-password',
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
						type: 'password',
						autoComplete: 'new-password',
					}}
					errors={fields.confirmPassword.errors}
				/>

				{form.errorUI}
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
					Reset password
				</Button>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
