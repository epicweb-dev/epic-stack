import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import { AuthorizationError } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { z } from 'zod'
import { authenticator } from '~/utils/auth.server'
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
import { passwordSchema, usernameSchema } from '~/utils/user-validation'

export const LoginFormSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
	redirectTo: z.string().optional(),
	remember: z.boolean(),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.clone().formData()
	const result = LoginFormSchema.safeParse(
		preprocessFormData(formData, LoginFormSchema),
	)
	if (!result.success) {
		return json({ status: 'error', errors: result.error.flatten() } as const, {
			status: 400,
		})
	}

	let userId: string | null = null
	try {
		userId = await authenticator.authenticate(FormStrategy.name, request, {
			throwOnError: true,
		})
	} catch (error) {
		if (error instanceof AuthorizationError) {
			return json(
				{
					status: 'error',
					errors: {
						formErrors: [error.message],
						fieldErrors: {},
					},
				} as const,
				{ status: 400 },
			)
		}
		throw error
	}

	const session = await getSession(request.headers.get('cookie'))
	session.set(authenticator.sessionKey, userId)
	const { remember, redirectTo } = result.data
	const newCookie = await commitSession(session, {
		maxAge: remember
			? 60 * 60 * 24 * 7 // 7 days
			: undefined,
	})
	if (redirectTo) {
		throw redirect(safeRedirect(redirectTo), {
			headers: { 'Set-Cookie': newCookie },
		})
	}
	return json({ status: 'success', errors: null } as const, {
		headers: { 'Set-Cookie': newCookie },
	})
}

export function InlineLogin({
	redirectTo,
	formError,
}: {
	redirectTo?: string
	formError?: string | null
}) {
	const loginFetcher = useFetcher<typeof action>()

	const { form, fields } = useForm({
		name: 'inline-login',
		errors: {
			...loginFetcher.data?.errors,
			formErrors: [
				formError,
				...(loginFetcher.data?.errors?.formErrors ?? []),
			].filter(Boolean),
		},
		fieldMetadatas: getFieldsFromSchema(LoginFormSchema),
	})

	return (
		<div>
			<div className="mx-auto w-full max-w-md px-8">
				<loginFetcher.Form
					method="POST"
					action="/resources/login"
					name="login"
					{...form.props}
				>
					<Field
						labelProps={{ ...fields.username.labelProps, children: 'Username' }}
						inputProps={{
							...fields.username.props,
							autoComplete: 'username',
						}}
						errors={fields.username.errors}
					/>

					<Field
						labelProps={{ ...fields.password.labelProps, children: 'Password' }}
						inputProps={{
							...fields.password.props,
							autoComplete: 'password',
							type: 'password',
						}}
						errors={fields.password.errors}
					/>

					<div className="flex justify-between">
						<CheckboxField
							labelProps={{
								...fields.remember.labelProps,
								children: 'Remember me',
							}}
							buttonProps={fields.remember.props}
							errors={fields.remember.errors}
						/>

						<div>
							<Link
								to="/forgot-password"
								className="text-body-xs font-semibold"
							>
								Forgot password?
							</Link>
						</div>
					</div>

					<input
						value={redirectTo}
						{...fields.redirectTo.props}
						type="hidden"
					/>

					{form.errorUI}

					<div className="flex items-center justify-between gap-6 pt-3">
						<Button
							className="w-full"
							size="md"
							variant="primary"
							status={
								loginFetcher.state === 'submitting'
									? 'pending'
									: loginFetcher.data?.status ?? 'idle'
							}
							type="submit"
							disabled={loginFetcher.state !== 'idle'}
						>
							Log in
						</Button>
					</div>
				</loginFetcher.Form>
				<div className="flex items-center justify-center gap-2 pt-6">
					<span className="text-night-200">New here?</span>
					<Link to="/signup">Create an account</Link>
				</div>
			</div>
		</div>
	)
}
