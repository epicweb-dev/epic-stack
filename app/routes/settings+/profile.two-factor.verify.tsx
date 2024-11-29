import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariant } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	redirect,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { and, eq } from 'drizzle-orm'
import * as QRCode from 'qrcode'
import { z } from 'zod'
import { ErrorList, OTPField } from '#app/components/forms.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { isCodeValid } from '#app/routes/_auth+/verify.server.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { drizzle } from '#app/utils/db.server.ts'
import { getDomainUrl, useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { getTOTPAuthUri } from '#app/utils/totp.server.ts'
import { User, Verification } from '#drizzle/schema.ts'
import { type BreadcrumbHandle } from './profile.tsx'
import { twoFAVerificationType } from './profile.two-factor.tsx'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="check">Verify</Icon>,
	getSitemapEntries: () => null,
}

const CancelSchema = z.object({ intent: z.literal('cancel') })
const VerifySchema = z.object({
	intent: z.literal('verify'),
	code: z.string().min(6).max(6),
})

const ActionSchema = z.discriminatedUnion('intent', [
	CancelSchema,
	VerifySchema,
])

export const twoFAVerifyVerificationType = '2fa-verify'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await drizzle.query.Verification.findFirst({
		where: and(
			eq(Verification.target, userId),
			eq(Verification.type, twoFAVerifyVerificationType),
		),
		columns: {
			id: true,
			algorithm: true,
			secret: true,
			period: true,
			digits: true,
		},
	})
	if (!verification) {
		return redirect('/settings/profile/two-factor')
	}
	const user = await drizzle.query.User.findFirst({
		where: eq(User.id, userId),
		columns: { email: true },
	})
	invariant(user, 'User not found')
	const issuer = new URL(getDomainUrl(request)).host
	const otpUri = getTOTPAuthUri({
		...verification,
		// OTP clients break with the `-` in the algorithm name.
		algorithm: verification.algorithm.replaceAll('-', ''),
		accountName: user.email,
		issuer,
	})
	const qrCode = await QRCode.toDataURL(otpUri)
	return json({ otpUri, qrCode })
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: () =>
			ActionSchema.superRefine(async (data, ctx) => {
				if (data.intent === 'cancel') return null
				const codeIsValid = await isCodeValid({
					code: data.code,
					type: twoFAVerifyVerificationType,
					target: userId,
				})
				if (!codeIsValid) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return z.NEVER
				}
			}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	switch (submission.value.intent) {
		case 'cancel': {
			await drizzle
				.delete(Verification)
				.where(
					and(
						eq(Verification.type, twoFAVerifyVerificationType),
						eq(Verification.target, userId),
					),
				)
			return redirect('/settings/profile/two-factor')
		}
		case 'verify': {
			await drizzle
				.update(Verification)
				.set({ type: twoFAVerificationType })
				.where(
					and(
						eq(Verification.type, twoFAVerifyVerificationType),
						eq(Verification.target, userId),
					),
				)
			return redirectWithToast('/settings/profile/two-factor', {
				type: 'success',
				title: 'Enabled',
				description: 'Two-factor authentication has been enabled.',
			})
		}
	}
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()

	const isPending = useIsPending()
	const pendingIntent = isPending ? navigation.formData?.get('intent') : null

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getZodConstraint(ActionSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ActionSchema })
		},
	})
	const lastSubmissionIntent = fields.intent.value

	return (
		<div>
			<div className="flex flex-col items-center gap-4">
				<img alt="qr code" src={data.qrCode} className="h-56 w-56" />
				<p>Scan this QR code with your authenticator app.</p>
				<p className="text-sm">
					If you cannot scan the QR code, you can manually add this account to
					your authenticator app using this code:
				</p>
				<div className="p-3">
					<pre
						className="whitespace-pre-wrap break-all text-sm"
						aria-label="One-time Password URI"
					>
						{data.otpUri}
					</pre>
				</div>
				<p className="text-sm">
					Once you've added the account, enter the code from your authenticator
					app below. Once you enable 2FA, you will need to enter a code from
					your authenticator app every time you log in or perform important
					actions. Do not lose access to your authenticator app, or you will
					lose access to your account.
				</p>
				<div className="flex w-full max-w-xs flex-col justify-center gap-4">
					<Form method="POST" {...getFormProps(form)} className="flex-1">
						<div className="flex items-center justify-center">
							<OTPField
								labelProps={{
									htmlFor: fields.code.id,
									children: 'Code',
								}}
								inputProps={{
									...getInputProps(fields.code, { type: 'text' }),
									autoFocus: true,
									autoComplete: 'one-time-code',
								}}
								errors={fields.code.errors}
							/>
						</div>

						<div className="min-h-[32px] px-4 pb-3 pt-1">
							<ErrorList id={form.errorId} errors={form.errors} />
						</div>

						<div className="flex justify-between gap-4">
							<StatusButton
								className="w-full"
								status={
									pendingIntent === 'verify'
										? 'pending'
										: lastSubmissionIntent === 'verify'
											? (form.status ?? 'idle')
											: 'idle'
								}
								type="submit"
								name="intent"
								value="verify"
							>
								Submit
							</StatusButton>
							<StatusButton
								className="w-full"
								variant="secondary"
								status={
									pendingIntent === 'cancel'
										? 'pending'
										: lastSubmissionIntent === 'cancel'
											? (form.status ?? 'idle')
											: 'idle'
								}
								type="submit"
								name="intent"
								value="cancel"
								disabled={isPending}
							>
								Cancel
							</StatusButton>
						</div>
					</Form>
				</div>
			</div>
		</div>
	)
}
