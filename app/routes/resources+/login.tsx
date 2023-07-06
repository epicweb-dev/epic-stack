import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import { AuthorizationError } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { safeRedirect } from 'remix-utils'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { authenticator } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { CheckboxField, ErrorList, Field } from '~/components/forms.tsx'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { passwordSchema, usernameSchema } from '~/utils/user-validation.ts'
import { checkboxSchema } from '~/utils/zod-extensions.ts'
import { twoFAVerificationType } from '../settings+/profile.two-factor.tsx'
import { unverifiedSessionKey } from './verify.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'

const ROUTE_PATH = '/resources/login'

export const loginFormSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
	redirectTo: z.string().optional(),
	remember: checkboxSchema(),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: loginFormSchema,
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

	let sessionId: string | null = null
	try {
		sessionId = await authenticator.authenticate(FormStrategy.name, request, {
			throwOnError: true,
			context: { formData },
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

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		select: { userId: true, expirationDate: true },
	})
	invariant(session, 'newly created session not found')

	const user2FA = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: session.userId },
		select: { id: true },
	})

	const cookieSession = await getSession(request.headers.get('cookie'))
	const keyToSet = user2FA ? unverifiedSessionKey : authenticator.sessionKey
	cookieSession.set(keyToSet, sessionId)
	const { remember, redirectTo } = submission.value
	const responseInit = {
		headers: {
			'Set-Cookie': await commitSession(cookieSession, {
				expires: remember ? session.expirationDate : undefined,
			}),
		},
	}
	if (user2FA || !redirectTo) {
		return json({ status: 'success', submission } as const, responseInit)
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
		constraint: getFieldsetConstraint(loginFormSchema),
		lastSubmission: loginFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: loginFormSchema })
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
						inputProps={{ ...conform.input(fields.username), autoFocus: true }}
						errors={fields.username.errors}
					/>

					<Field
						labelProps={{ children: 'Password' }}
						inputProps={conform.input(fields.password, { type: 'password' })}
						errors={fields.password.errors}
					/>

					<div className="flex justify-between">
						<CheckboxField
							labelProps={{
								htmlFor: fields.remember.id,
								children: 'Remember me',
							}}
							buttonProps={conform.input(fields.remember, { type: 'checkbox' })}
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
