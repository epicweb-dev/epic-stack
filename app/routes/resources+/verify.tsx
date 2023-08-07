import { conform, useForm, type Submission } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { generateTOTP, verifyTOTP } from '@epic-web/totp'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { prisma } from '~/utils/db.server.ts'
import { EnsurePE, getDomainUrl, useIsSubmitting } from '~/utils/misc.tsx'
import { handleVerification as handleForgotPasswordVerification } from '../_auth+/forgot-password/index.tsx'
import { handleVerification as handleOnboardingVerification } from '../_auth+/onboarding.tsx'
import { handleVerification as handleChangeEmailVerification } from '../settings+/profile.change-email.index/index.tsx'
import { handleVerification as handleEnableTwoFactorVerification } from '../settings+/profile.two-factor.verify.tsx'
import { handleVerification as handleLoginTwoFactorVerification } from './login.tsx'

export const ROUTE_PATH = '/resources/verify'

export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
export const typeQueryParam = 'type'
export const redirectToQueryParam = 'redirectTo'
const types = [
	'forgot-password',
	'onboarding',
	'2fa',
	'2fa-verify',
	'change-email',
] as const
export type VerificationTypes = (typeof types)[number]

const typeOTPConfig: Record<VerificationTypes, { window: number }> = {
	'forgot-password': { window: 0 },
	onboarding: { window: 0 },
	'change-email': { window: 0 },
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
	return validateRequest(request, await request.formData())
}

export type VerifySubmission = Submission<z.infer<typeof VerifySchema>>

export type VerifyFunctionArgs = {
	request: Request
	submission: Submission<z.infer<typeof VerifySchema>>
	body: FormData | URLSearchParams
}

export async function isCodeValid({
	code,
	type,
	target,
}: {
	code: string
	type: VerificationTypes
	target: string
}) {
	const verification = await prisma.verification.findFirst({
		where: {
			OR: [
				{ type, target, expiresAt: { gt: new Date() } },
				{ type, target, expiresAt: null },
			],
		},
		select: { algorithm: true, secret: true, period: true },
	})
	if (!verification) return false
	const result = verifyTOTP({
		otp: code,
		secret: verification.secret,
		algorithm: verification.algorithm,
		period: verification.period,
		...typeOTPConfig[type],
	})
	if (!result) return false

	return true
}

export async function validateRequest(
	request: Request,
	body: URLSearchParams | FormData,
) {
	const submission = await parse(body, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				const codeIsValid = await isCodeValid({
					code: data[codeQueryParam],
					type: data[typeQueryParam],
					target: data[targetQueryParam],
				})
				if (!codeIsValid) {
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

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { value: submissionValue } = submission

	async function deleteVerification() {
		return prisma.verification.delete({
			where: {
				target_type: {
					type: submissionValue[typeQueryParam],
					target: submissionValue[targetQueryParam],
				},
			},
		})
	}

	switch (submissionValue[typeQueryParam]) {
		case 'forgot-password': {
			await deleteVerification()
			return handleForgotPasswordVerification({ request, body, submission })
		}
		case 'onboarding': {
			await deleteVerification()
			return handleOnboardingVerification({ request, body, submission })
		}
		case '2fa-verify': {
			return handleEnableTwoFactorVerification({ request, body, submission })
		}
		case '2fa': {
			return handleLoginTwoFactorVerification({ request, body, submission })
		}
		case 'change-email': {
			await deleteVerification()
			return await handleChangeEmailVerification({ request, body, submission })
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
					<EnsurePE />
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
