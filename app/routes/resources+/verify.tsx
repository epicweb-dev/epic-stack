import { conform, useForm, type Submission } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { prisma } from '~/utils/db.server.ts'
import {
	getDomainUrl,
	invariantResponse,
	useIsSubmitting,
} from '~/utils/misc.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { generateTOTP, verifyTOTP } from '~/utils/totp.server.ts'
import { onboardingEmailSessionKey } from '../_auth+/onboarding.tsx'
import { resetPasswordUsernameSessionKey } from '../_auth+/reset-password.tsx'
import { unverifiedSessionKey } from './login.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { authenticator } from '~/utils/auth.server.ts'
import { safeRedirect } from 'remix-utils'

export const ROUTE_PATH = '/resources/verify'

export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
export const typeQueryParam = 'type'
export const redirectToQueryParam = 'redirectTo'
const types = ['forgot-password', 'onboarding', '2fa', '2fa-verify'] as const
export type VerificationTypes = (typeof types)[number]

const typeOTPConfig: Record<VerificationTypes, { window: number }> = {
	'forgot-password': { window: 0 },
	onboarding: { window: 0 },
	'2fa': { window: 1 },
	'2fa-verify': { window: 1 },
}

const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(6).max(6),
	[typeQueryParam]: z.enum(types),
	[targetQueryParam]: z.string(),
	[redirectToQueryParam]: z.string().optional(),
})

export function getRedirectToUrl({
	request,
	type,
	target,
}: {
	request: Request
	type: VerificationTypes
	target: string
}) {
	const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`)
	redirectToUrl.searchParams.set(typeQueryParam, type)
	redirectToUrl.searchParams.set(targetQueryParam, target)
	return redirectToUrl
}

export async function prepareVerification({
	period,
	request,
	type,
	target,
}: {
	period: number
	request: Request
	type: VerificationTypes
	target: string
}) {
	const verifyUrl = getRedirectToUrl({ request, type, target })
	const redirectTo = new URL(verifyUrl.toString())

	const { otp, ...otpConfig } = generateTOTP({ algorithm: 'SHA256', period })
	// delete old verifications. Users should not have more than one verification
	// of a specific type for a specific target at a time.
	await prisma.verification.deleteMany({ where: { type, target } })
	await prisma.verification.create({
		data: {
			type,
			target,
			...otpConfig,
			expiresAt: new Date(Date.now() + otpConfig.period * 1000),
		},
	})

	// add the otp to the url we'll email the user.
	verifyUrl.searchParams.set(codeQueryParam, otp)

	return { otp, redirectTo, verifyUrl }
}

export async function action({ request }: DataFunctionArgs) {
	return validate(request, await request.formData())
}

export async function validate(
	request: Request,
	body: URLSearchParams | FormData,
) {
	const submission = await parse(body, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				const verification = await prisma.verification.findFirst({
					where: {
						OR: [
							{
								type: data[typeQueryParam],
								target: data[targetQueryParam],
								expiresAt: { gt: new Date() },
							},
							{
								type: data[typeQueryParam],
								target: data[targetQueryParam],
								expiresAt: null,
							},
						],
					},
					select: {
						algorithm: true,
						secret: true,
						period: true,
					},
				})
				if (!verification) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return
				}
				const result = verifyTOTP({
					otp: data[codeQueryParam],
					secret: verification.secret,
					algorithm: verification.algorithm,
					period: verification.period,
					...typeOTPConfig[data[typeQueryParam]],
				})
				if (!result) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return
				}
			}),
		acceptMultipleErrors: () => true,
		async: true,
	})
	// delete the code from the submission
	delete submission.payload[codeQueryParam]
	// @ts-expect-error conform should probably have support for doing this
	delete submission.value?.[codeQueryParam]

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	switch (submission.value[typeQueryParam]) {
		case 'forgot-password': {
			await prisma.verification.deleteMany({
				where: {
					type: submission.value[typeQueryParam],
					target: submission.value[targetQueryParam],
				},
			})
			const { target } = submission.value
			const user = await prisma.user.findFirst({
				where: { OR: [{ email: target }, { username: target }] },
				select: { email: true, username: true },
			})
			// we don't want to say the user is not found if the email is not found
			// because that would allow an attacker to check if an email is registered
			invariantResponse(user, 'Invalid code')

			const session = await getSession(request.headers.get('cookie'))
			session.set(resetPasswordUsernameSessionKey, user.username)
			return redirect('/reset-password', {
				headers: { 'Set-Cookie': await commitSession(session) },
			})
		}
		case 'onboarding': {
			await prisma.verification.deleteMany({
				where: {
					type: submission.value[typeQueryParam],
					target: submission.value[targetQueryParam],
				},
			})
			const session = await getSession(request.headers.get('cookie'))
			session.set(onboardingEmailSessionKey, submission.value[targetQueryParam])
			return redirect('/onboarding', {
				headers: { 'Set-Cookie': await commitSession(session) },
			})
		}
		case '2fa': {
			const cookieSession = await getSession(request.headers.get('Cookie'))
			const sessionId = cookieSession.get(unverifiedSessionKey)
			if (!sessionId) {
				// they should not be able to get here
				return redirectWithToast('/login', {
					title: 'Unable to verify',
					description: 'Something went wrong. Please try again.',
				})
			}
			cookieSession.unset(unverifiedSessionKey)
			cookieSession.set(authenticator.sessionKey, sessionId)
			const newCookie = await commitSession(cookieSession)
			if (submission.value[redirectToQueryParam]) {
				return redirect(safeRedirect(submission.value[redirectToQueryParam]), {
					headers: { 'Set-Cookie': newCookie },
				})
			}
			return json({ status: 'success', submission } as const, {
				headers: { 'Set-Cookie': newCookie },
			})
		}
		case '2fa-verify': {
			const verification = await prisma.verification.findFirst({
				where: {
					type: submission.value[typeQueryParam],
					target: submission.value[targetQueryParam],
				},
				select: { id: true },
			})
			// this should not be possible... but just in case...
			invariantResponse(verification, 'Invalid code')
			await prisma.verification.update({
				where: { id: verification.id },
				data: { type: '2fa' satisfies VerificationTypes },
			})
			if (submission.value[redirectToQueryParam]) {
				return redirect(safeRedirect(submission.value[redirectToQueryParam]))
			}
			return json({ status: 'success', submission } as const)
		}
		default: {
			submission.error[''] = ['Invalid verification type']
			return json({ status: 'error', submission } as const, { status: 400 })
		}
	}
}

export function Verify({
	initialSubmission,
	code,
	type,
	target,
	redirectTo,
	submitChildren = 'Confirm',
	cancelButton,
	fieldLabel = 'Code',
}: {
	initialSubmission?: Submission<z.infer<typeof VerifySchema>>
	code?: string
	type: VerificationTypes
	target: string
	redirectTo?: string
	submitChildren?: React.ReactNode
	cancelButton?: React.ReactNode
	fieldLabel?: string
}) {
	const isSubmitting = useIsSubmitting()
	const verifyFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getFieldsetConstraint(VerifySchema),
		lastSubmission: verifyFetcher.data?.submission ?? initialSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema: VerifySchema })
		},
		defaultValue: { code, type, target, redirectTo },
	})

	return (
		<div className="mx-auto flex flex-col justify-center gap-1">
			<div>
				<Field
					labelProps={{
						htmlFor: fields[codeQueryParam].id,
						children: fieldLabel,
					}}
					inputProps={conform.input(fields[codeQueryParam])}
					errors={fields[codeQueryParam].errors}
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
			</div>
			<div className="flex w-full gap-2">
				{cancelButton}
				<verifyFetcher.Form
					method="POST"
					action={ROUTE_PATH}
					{...form.props}
					className="flex-1"
				>
					<input
						{...conform.input(fields[typeQueryParam], { type: 'hidden' })}
					/>
					<input
						{...conform.input(fields[targetQueryParam], { type: 'hidden' })}
					/>
					<input
						{...conform.input(fields[redirectToQueryParam], { type: 'hidden' })}
					/>
					<StatusButton
						className="w-full"
						status={
							isSubmitting ? 'pending' : verifyFetcher.data?.status ?? 'idle'
						}
						type="submit"
						disabled={isSubmitting}
					>
						{submitChildren}
					</StatusButton>
				</verifyFetcher.Form>
			</div>
		</div>
	)
}
