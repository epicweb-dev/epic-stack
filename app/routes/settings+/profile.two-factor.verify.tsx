import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import * as QRCode from 'qrcode'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { getDomainUrl, invariantResponse } from '~/utils/misc.ts'
import { getTOTPAuthUri } from '~/utils/totp.server.ts'
import { useUser } from '~/utils/user.ts'
import { type VerificationTypes, Verify } from '../resources+/verify.tsx'

export const handle = {
	breadcrumb: <Icon name="check">Verify</Icon>,
}
export const verificationType = '2fa-verify' satisfies VerificationTypes

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
	invariantResponse(formData.get('intent') === 'cancel', 'Invalid intent')
	await prisma.verification.deleteMany({
		where: { type: verificationType, target: userId },
	})
	return redirect('/settings/profile/two-factor')
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useUser()
	const toggle2FAFetcher = useFetcher<typeof action>()

	return (
		<div>
			<div className="flex flex-col items-center gap-4">
				<img alt="qr code" src={data?.qrCode} className="h-56 w-56" />
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
				<div className="flex w-full max-w-xs flex-col justify-center gap-4">
					<Verify
						type="2fa-verify"
						target={user.id}
						redirectTo="/settings/profile/two-factor"
						cancelButton={
							<toggle2FAFetcher.Form method="POST" className="w-full flex-1">
								<StatusButton
									variant="secondary"
									type="submit"
									name="intent"
									value="cancel"
									className="w-full"
									status={
										toggle2FAFetcher.state === 'loading' &&
										toggle2FAFetcher.formData?.get('intent') === 'cancel'
											? 'pending'
											: 'idle'
									}
								>
									Cancel
								</StatusButton>
							</toggle2FAFetcher.Form>
						}
					/>
				</div>
			</div>
		</div>
	)
}
