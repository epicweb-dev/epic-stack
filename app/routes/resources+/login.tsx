import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import { AuthorizationError } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { z } from 'zod'
import { authenticator } from '~/utils/auth.server'
import { Button, CheckboxField, ErrorList, Field } from '~/utils/forms'
import { safeRedirect } from '~/utils/misc'
import { commitSession, getSession } from '~/utils/session.server'
import { passwordSchema, usernameSchema } from '~/utils/user-validation'
import { checkboxSchema } from '~/utils/zod-extensions'

export const LoginFormSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
	redirectTo: z.string().optional(),
	remember: checkboxSchema(),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.clone().formData()
	const submission = parse(formData, {
		schema: LoginFormSchema,
		acceptMultipleErrors: () => true,
	})
	if (!submission.value || submission.intent !== 'submit') {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
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
					submission: {
						...submission,
						error: {
							// show authorization error as a form level error message.
							'': error.message,
						},
					},
				} as const,
				{ status: 400 },
			)
		}
		throw error
	}

	const session = await getSession(request.headers.get('cookie'))
	session.set(authenticator.sessionKey, userId)
	const { remember, redirectTo } = submission.value
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
	return json({ status: 'success', submission } as const, {
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

	const [form, fields] = useForm({
		id: 'inline-login',
		constraint: getFieldsetConstraint(LoginFormSchema),
		lastSubmission: loginFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: LoginFormSchema })
		},
		shouldRevalidate: 'onBlur',
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
						labelProps={{
							htmlFor: fields.username.id,
							children: 'Username',
						}}
						inputProps={fields.username}
						errors={fields.username.errors}
					/>

					<Field
						labelProps={{
							htmlFor: fields.password.id,
							children: 'Password',
						}}
						inputProps={{ ...fields.password, type: 'password' }}
						errors={fields.password.errors}
					/>

					<div className="flex justify-between">
						<CheckboxField
							labelProps={{
								htmlFor: fields.remember.id,
								children: 'Remember me',
							}}
							buttonProps={fields.remember}
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

					<input value={redirectTo} {...fields.redirectTo} type="hidden" />
					<ErrorList errors={formError ? [formError] : []} />
					<ErrorList errors={form.errors} id={form.errorId} />

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
