import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import { AuthorizationError } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { safeRedirect } from 'remix-utils'
import { z } from 'zod'
import { CheckboxField, ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import {
	TwoFactorCodeInvalidError,
	TwoFactorCodeRequiredError,
	authenticator,
} from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { invariantResponse } from '~/utils/misc.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { passwordSchema, usernameSchema } from '~/utils/user-validation.ts'
import { checkboxSchema } from '~/utils/zod-extensions.ts'

const ROUTE_PATH = '/resources/login'

export const LoginFormSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
	redirectTo: z.string().optional(),
	remember: checkboxSchema(),
	code: z.string().optional(),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const twoFARequired = formData.get('twoFARequired') === 'true'
	const submission = parse(formData, {
		schema: LoginFormSchema,
		acceptMultipleErrors: () => true,
	})
	// get the password off the payload that's sent back
	delete submission.payload.password
	// @ts-expect-error - conform should probably have support for doing this
	delete submission.value?.password

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', twoFARequired, submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', twoFARequired, submission } as const, {
			status: 400,
		})
	}

	let sessionId: string | null = null
	try {
		sessionId = await authenticator.authenticate(FormStrategy.name, request, {
			throwOnError: true,
			context: { formData },
		})
	} catch (error) {
		if (error instanceof AuthorizationError) {
			if (error.message === TwoFactorCodeRequiredError) {
				if (twoFARequired) {
					submission.error.code = TwoFactorCodeRequiredError
					return json({ status: 'error', twoFARequired, submission } as const, {
						status: 400,
					})
				} else {
					return json(
						{ status: 'idle', twoFARequired: true, submission } as const,
						{
							status: 400,
						},
					)
				}
			}
			if (error.message === TwoFactorCodeInvalidError) {
				submission.error.code = TwoFactorCodeInvalidError
				return json({ status: 'error', twoFARequired, submission } as const, {
					status: 400,
				})
			}
			return json(
				{
					status: 'error',
					twoFARequired,
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

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		select: { userId: true, expirationDate: true },
	})
	invariantResponse(session, 'newly created session not found')

	const cookieSession = await getSession(request.headers.get('cookie'))
	cookieSession.set(authenticator.sessionKey, sessionId)
	const { remember, redirectTo } = submission.value
	const responseInit = {
		headers: {
			'Set-Cookie': await commitSession(cookieSession, {
				// Cookies with no expiration are cleared when the tab/window closes
				expires: remember ? session.expirationDate : undefined,
			}),
		},
	}

	if (!redirectTo) {
		return json(
			{ status: 'success', twoFARequired, submission } as const,
			responseInit,
		)
	} else {
		throw redirect(safeRedirect(redirectTo), responseInit)
	}
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
		defaultValue: { redirectTo },
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
					action={ROUTE_PATH}
					name="login"
					{...form.props}
				>
					<Field
						labelProps={{ children: 'Username' }}
						inputProps={{
							...conform.input(fields.username),
							autoFocus: true,
							className: 'lowercase',
						}}
						errors={fields.username.errors}
					/>

					<Field
						labelProps={{ children: 'Password' }}
						inputProps={conform.input(fields.password, {
							type: 'password',
						})}
						errors={fields.password.errors}
					/>

					<input
						type="hidden"
						name="twoFARequired"
						value={loginFetcher.data?.twoFARequired ? 'true' : 'false'}
					/>

					{loginFetcher.data?.twoFARequired ? (
						<Field
							labelProps={{ children: '2FA Code' }}
							inputProps={{ ...conform.input(fields.code), autoFocus: true }}
							errors={fields.code.errors}
						/>
					) : null}

					<div className="flex justify-between">
						<CheckboxField
							labelProps={{
								htmlFor: fields.remember.id,
								children: 'Remember me',
							}}
							buttonProps={conform.input(fields.remember, {
								type: 'checkbox',
							})}
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

					<input {...conform.input(fields.redirectTo)} type="hidden" />
					<ErrorList errors={[...form.errors, formError]} id={form.errorId} />

					<div className="flex items-center justify-between gap-6 pt-3">
						<StatusButton
							className="w-full"
							status={
								loginFetcher.state === 'submitting'
									? 'pending'
									: loginFetcher.data?.status ?? 'idle'
							}
							type="submit"
							disabled={loginFetcher.state !== 'idle'}
						>
							Log in
						</StatusButton>
					</div>
				</loginFetcher.Form>
				<div className="flex items-center justify-center gap-2 pt-6">
					<span className="text-muted-foreground">New here?</span>
					<Link to="/signup">Create an account</Link>
				</div>
			</div>
		</div>
	)
}
