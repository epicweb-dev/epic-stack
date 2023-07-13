import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import * as QRCode from 'qrcode'
import { useState } from 'react'
import { z } from 'zod'
import { Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { getDomainUrl, invariantResponse } from '~/utils/misc.ts'
import { getTOTPAuthUri, verifyTOTP } from '~/utils/totp.server.ts'

export const verificationType = '2fa-verify'

const verifySchema = z.union([
	z.object({
		intent: z.literal('confirm'),
		otp: z.string().min(6).max(6),
	}),
	z.object({
		intent: z.literal('cancel'),
	}),
])

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await prisma.verification.findFirst({
		where: { type: verificationType, target: userId },
		select: {
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
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { email: true },
	})
	if (user == null) {
		// This should not be possible
		throw new Error(`user with ID "${userId}" is unknown`)
	}
	const issuer = new URL(getDomainUrl(request)).host
	const otpUri = getTOTPAuthUri({
		...verification,
		accountName: user.email,
		issuer,
	})
	const qrCode = await QRCode.toDataURL(otpUri)
	return json({ otpUri, qrCode })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const verification = await prisma.verification.findFirst({
		where: {
			type: verificationType,
			target: userId,
		},
		select: {
			id: true,
			algorithm: true,
			secret: true,
			period: true,
		},
	})
	const submission = await parse(formData, {
		schema: () => {
			return verifySchema.superRefine(async (data, ctx) => {
				if (data.intent === 'cancel') return

				if (!verification) {
					ctx.addIssue({
						path: ['otp'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return
				}
				const result = verifyTOTP({
					otp: data.otp,
					secret: verification.secret,
					algorithm: verification.algorithm,
					period: verification.period,
					window: 1,
				})
				if (!result) {
					ctx.addIssue({
						path: ['otp'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
				}
			})
		},
		acceptMultipleErrors: () => true,
		async: true,
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

	switch (submission.value.intent) {
		case 'confirm': {
			invariantResponse(verification, 'Verification should exist by this point')
			// upgrade to regular 2fa
			await prisma.verification.update({
				where: { id: verification.id },
				data: { type: '2fa' },
			})
			break
		}
		case 'cancel': {
			await prisma.verification.deleteMany({
				where: { type: verificationType, target: userId },
			})
			break
		}
		default: {
			submission.error = { '': 'Invalid intent' }
			return json({ status: 'error', submission } as const)
		}
	}
	return redirect('/settings/profile/two-factor')
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>() || {}
	const toggle2FAFetcher = useFetcher<typeof action>()

	const [qrImgSrc] = useState(data?.qrCode)

	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(verifySchema),
		lastSubmission: toggle2FAFetcher.data?.submission,
		onValidate({ formData }) {
			const result = parse(formData, { schema: verifySchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div>
			<div className="flex flex-col items-center gap-4">
				<img alt="qr code" src={qrImgSrc} className="h-56 w-56" />
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
						{data?.otpUri}
					</pre>
				</div>
				<p className="text-sm">
					Once you've added the account, enter the code from your authenticator
					app below. Once you enable 2FA, you will need to enter a code from
					your authenticator app every time you log in or perform important
					actions. Do not lose access to your authenticator app, or you will
					lose access to your account.
				</p>
				<toggle2FAFetcher.Form
					method="POST"
					preventScrollReset
					className="w-full"
					{...form.props}
				>
					<Field
						labelProps={{
							children: 'Code',
						}}
						inputProps={conform.input(fields.otp)}
						errors={fields.otp.errors}
						className="mx-auto w-28"
					/>
					<div className="flex flex-row-reverse justify-between">
						<StatusButton
							type="submit"
							name="intent"
							value="confirm"
							status={
								toggle2FAFetcher.state === 'loading' &&
								toggle2FAFetcher.formData?.get('intent') === 'confirm'
									? 'pending'
									: 'idle'
							}
						>
							Confirm
						</StatusButton>
						<StatusButton
							variant="secondary"
							type="submit"
							name="intent"
							value="cancel"
							status={
								toggle2FAFetcher.state === 'loading' &&
								toggle2FAFetcher.formData?.get('intent') === 'cancel'
									? 'pending'
									: 'idle'
							}
						>
							Cancel
						</StatusButton>
					</div>
				</toggle2FAFetcher.Form>
			</div>
		</div>
	)
}
