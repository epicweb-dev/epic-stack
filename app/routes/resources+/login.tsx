import { type Submission, conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Link, useFetcher } from '@remix-run/react'
import { FormStrategy } from 'remix-auth-form'
import { safeRedirect } from 'remix-utils'
import { z } from 'zod'
import { CheckboxField, ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { authenticator, getUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import {
	EnsurePE,
	ensurePE,
	getReferrerRoute,
	invariant,
} from '~/utils/misc.tsx'
import {
	commitSession,
	destroySession,
	getSession,
} from '~/utils/session.server.ts'
import { passwordSchema, usernameSchema } from '~/utils/user-validation.ts'
import {
	type VerificationTypes,
	isCodeValid,
	type VerifyFunctionArgs,
} from './verify.tsx'

const ROUTE_PATH = '/resources/login'

export async function getLoginLoaderData({ request }: DataFunctionArgs) {
	const url = new URL(request.url)
	const session = await getSession(request.headers.get('cookie'))
	const error = session.get(authenticator.sessionErrorKey)
	let errorMessage: string | null = null
	if (typeof error?.message === 'string') {
		errorMessage = error.message
	}
	return {
		redirectTo: url.searchParams.get('redirectTo') ?? '/',
		loginFormError: errorMessage,
		loginSubmission: session.get(loginSubmissionKey),
		tfaSubmission: session.get(tfaSubmissionKey),
		requestTwoFA: await shouldRequestTwoFA(request),
	}
}

const LoginFormSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
	redirectTo: z.string().optional(),
	remember: z.boolean().optional(),
})

const verifiedTimeKey = 'verified-time'
const unverifiedSessionIdKey = 'unverified-session-id'
const loginSubmissionKey = 'login-submission'
const inlineLoginFormId = 'inline-login'
const inlineTwoFAFormId = 'inline-two-fa'
const verificationType = '2fa' satisfies VerificationTypes

export async function handleVerification({
	request,
	body,
	submission,
}: VerifyFunctionArgs) {
	invariant(submission.value, 'Submission should have a value by this point')
	const cookieSession = await getSession(request.headers.get('cookie'))
	const { redirectTo } = submission.value
	cookieSession.set(verifiedTimeKey, Date.now())
	const responseInit = {
		headers: { 'Set-Cookie': await commitSession(cookieSession) },
	}

	if (redirectTo) {
		return redirect(safeRedirect(redirectTo), responseInit)
	} else {
		ensurePE(body, request, responseInit)
		return json({ status: 'success', submission } as const, responseInit)
	}
}

export async function shouldRequestTwoFA(request: Request) {
	const cookieSession = await getSession(request.headers.get('cookie'))
	if (cookieSession.has(unverifiedSessionIdKey)) return true
	const userId = await getUserId(request)
	if (!userId) return false
	// if it's over two hours since they last verified, we should request 2FA again
	const userHasTwoFA = await prisma.verification.findUnique({
		select: { id: true },
		where: { target_type: { target: userId, type: verificationType } },
	})
	if (!userHasTwoFA) return false
	const verifiedTime = cookieSession.get(verifiedTimeKey) ?? new Date(0)
	const twoHours = 1000 * 60 * 60 * 2
	return Date.now() - verifiedTime > twoHours
}

export async function action(args: DataFunctionArgs) {
	const form = (await args.request.clone().formData()).get('form')
	if (form === inlineTwoFAFormId) {
		return inlineTwoFAAction(args)
	} else if (form === inlineLoginFormId) {
		return inlineLoginAction(args)
	} else {
		throw new Response('Invalid form', { status: 400 })
	}
}

async function inlineLoginAction({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const cookieSession = await getSession(request.headers.get('cookie'))
	const submission = await parse(formData, {
		schema: intent =>
			LoginFormSchema.transform(async (data, ctx) => {
				if (intent !== 'submit') return { ...data, session: null }

				try {
					const sessionId = await authenticator.authenticate(
						FormStrategy.name,
						request,
						{
							throwOnError: true,
							context: { formData },
						},
					)
					const session = await prisma.session.findUniqueOrThrow({
						where: { id: sessionId },
						select: { userId: true, id: true, expirationDate: true },
					})
					return { ...data, session }
				} catch (error) {
					if (error instanceof Error) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: error.message,
						})

						return z.NEVER
					}

					throw error
				}
			}),
		async: true,
	})
	// get the password off the payload that's sent back
	delete submission.payload.password
	// @ts-expect-error - conform should probably have support for doing this
	delete submission.value?.password

	if (submission.intent !== 'submit') {
		await ensurePE(formData, request, async () => {
			cookieSession.flash(loginSubmissionKey, submission)
			return {
				headers: { 'Set-Cookie': await commitSession(cookieSession) },
			}
		})
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value || !submission.value.session) {
		await ensurePE(formData, request, async () => {
			cookieSession.flash(loginSubmissionKey, submission)
			return {
				headers: { 'Set-Cookie': await commitSession(cookieSession) },
			}
		})
		return json({ status: 'error', submission } as const, {
			status: 400,
		})
	}

	const { remember, redirectTo, session } = submission.value

	const verification = await prisma.verification.findUnique({
		where: { target_type: { target: session.userId, type: verificationType } },
		select: { id: true },
	})
	const userHasTwoFactor = Boolean(verification)

	const keyToSet = userHasTwoFactor
		? unverifiedSessionIdKey
		: authenticator.sessionKey
	cookieSession.set(keyToSet, session.id)
	const responseInit = {
		headers: {
			'Set-Cookie': await commitSession(cookieSession, {
				// Cookies with no expiration are cleared when the tab/window closes
				expires: remember ? session.expirationDate : undefined,
			}),
		},
	}

	if (!redirectTo || userHasTwoFactor) {
		await ensurePE(formData, request, responseInit)
		// if the user has two factor, the route should revalidate and the
		// requestTwoFA should trigger rendering the second part of the flow.
		return json({ status: 'success', submission } as const, responseInit)
	} else {
		return redirect(safeRedirect(redirectTo), responseInit)
	}
}

export function InlineLogin({
	redirectTo,
	loginFormError,
	requestTwoFA,
	loginSubmission,
	tfaSubmission,
}: SerializeFrom<typeof getLoginLoaderData>) {
	return requestTwoFA ? (
		<InlineTwoFA redirectTo={redirectTo} submission={tfaSubmission} />
	) : (
		<InlineLoginForm
			redirectTo={redirectTo}
			formError={loginFormError}
			submission={loginSubmission}
		/>
	)
}

function InlineLoginForm({
	redirectTo,
	formError,
	submission,
}: {
	redirectTo?: string
	formError?: string | null
	submission?: Submission
}) {
	const loginFetcher = useFetcher<typeof inlineLoginAction>()

	const [form, fields] = useForm({
		id: inlineLoginFormId,
		defaultValue: { redirectTo },
		constraint: getFieldsetConstraint(LoginFormSchema),
		lastSubmission: loginFetcher.data?.submission ?? submission,
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
					<input type="hidden" name="form" value={form.id} />
					<EnsurePE />
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

const TwoFAFormSchema = z.object({
	redirectTo: z.string().optional(),
	code: z.string().min(6).max(6),
})

const tfaSubmissionKey = 'tfa-submission'

async function inlineTwoFAAction({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	if (formData.get('intent') === 'cancel') {
		const cookieSession = await getSession(request.headers.get('cookie'))
		cookieSession.unset(unverifiedSessionIdKey)
		cookieSession.unset(authenticator.sessionKey)
		return redirect(safeRedirect(getReferrerRoute(request)), {
			headers: { 'Set-Cookie': await commitSession(cookieSession) },
		})
	}
	const cookieSession = await getSession(request.headers.get('cookie'))
	const sessionId = cookieSession.get(unverifiedSessionIdKey)
	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		select: { userId: true, id: true },
	})
	if (!session) {
		// this should definitely not happen, but if it does, let's clear their
		// cookie and let them try again.
		throw redirectWithToast(
			'/',
			{ title: 'Invalid Session', description: 'Please login again.' },
			{ headers: { 'Set-Cookie': await destroySession(cookieSession) } },
		)
	}

	const submission = await parse(formData, {
		schema: TwoFAFormSchema.superRefine(async (data, ctx) => {
			const codeIsValid = await isCodeValid({
				code: data.code,
				type: verificationType,
				target: session.userId,
			})
			if (!codeIsValid) {
				ctx.addIssue({
					path: ['code'],
					code: 'custom',
					message: 'Invalid code.',
				})
			}
		}),
		async: true,
	})

	if (submission.intent !== 'submit') {
		await ensurePE(formData, request, async () => {
			cookieSession.flash(tfaSubmissionKey, submission)
			return {
				headers: { 'Set-Cookie': await commitSession(cookieSession) },
			}
		})
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		await ensurePE(formData, request, async () => {
			cookieSession.flash(tfaSubmissionKey, submission)
			return {
				headers: { 'Set-Cookie': await commitSession(cookieSession) },
			}
		})
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { redirectTo } = submission.value
	cookieSession.set(verifiedTimeKey, Date.now())
	cookieSession.unset(unverifiedSessionIdKey)
	cookieSession.set(authenticator.sessionKey, session.id)
	const responseInit = {
		headers: { 'Set-Cookie': await commitSession(cookieSession) },
	}

	if (redirectTo) {
		return redirect(safeRedirect(redirectTo), responseInit)
	} else {
		ensurePE(formData, request, responseInit)
		return json({ status: 'success', submission } as const, responseInit)
	}
}

function InlineTwoFA({
	redirectTo,
	formError,
	submission,
}: {
	redirectTo?: string
	formError?: string | null
	submission?: Submission
}) {
	const twoFAFetcher = useFetcher<typeof inlineTwoFAAction>()

	const [form, fields] = useForm({
		id: inlineTwoFAFormId,
		defaultValue: { redirectTo },
		constraint: getFieldsetConstraint(TwoFAFormSchema),
		lastSubmission: twoFAFetcher.data?.submission ?? submission,
		onValidate({ formData }) {
			return parse(formData, { schema: TwoFAFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<twoFAFetcher.Form method="POST" action={ROUTE_PATH} {...form.props}>
			<input type="hidden" name="form" value={form.id} />
			{/* Putting this at the top so we can have the tab order of cancel first,
			but have "enter" submit the confirmation. */}
			<button type="submit" className="hidden" name="intent" value="confirm" />
			<EnsurePE />
			<Field
				labelProps={{ children: 'Two Factor Code' }}
				inputProps={{
					...conform.input(fields.code),
					autoFocus: true,
				}}
				errors={fields.code.errors}
			/>
			<input {...conform.input(fields.redirectTo)} type="hidden" />
			<ErrorList errors={[...form.errors, formError]} id={form.errorId} />
			<div className="flex gap-4">
				<StatusButton
					className="w-full"
					variant="secondary"
					name="intent"
					value="cancel"
					status={
						twoFAFetcher.state === 'submitting' &&
						twoFAFetcher.formData?.get('intent') === 'cancel'
							? 'pending'
							: twoFAFetcher.data?.status ?? 'idle'
					}
					type="submit"
					disabled={twoFAFetcher.state !== 'idle'}
				>
					Cancel
				</StatusButton>
				<StatusButton
					className="w-full"
					name="intent"
					value="confirm"
					status={
						twoFAFetcher.state === 'submitting' &&
						twoFAFetcher.formData?.get('intent') === 'confirm'
							? 'pending'
							: twoFAFetcher.data?.status ?? 'idle'
					}
					type="submit"
					disabled={twoFAFetcher.state !== 'idle'}
				>
					Confirm
				</StatusButton>
			</div>
		</twoFAFetcher.Form>
	)
}
