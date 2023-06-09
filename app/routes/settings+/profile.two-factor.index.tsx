import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { Button } from '~/utils/forms.tsx'
import { generateTOTP } from '~/utils/totp.server.ts'
import { verificationType as verifyVerificationType } from './profile.two-factor.verify.tsx'
import { twoFAVerificationType } from './profile.two-factor.tsx'

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: userId },
		select: { id: true },
	})
	return json({ is2FAEnabled: Boolean(verification) })
}

export async function action({ request }: DataFunctionArgs) {
	const form = await request.formData()
	const userId = await requireUserId(request)
	const intent = form.get('intent')
	switch (intent) {
		case 'enable': {
			const { otp: _otp, ...config } = generateTOTP()
			// delete any existing entries
			await prisma.verification.deleteMany({
				where: { type: verifyVerificationType, target: userId },
			})
			await prisma.verification.create({
				data: { ...config, type: verifyVerificationType, target: userId },
			})
			return redirect('/settings/profile/two-factor/verify')
		}
		case 'disable': {
			await prisma.verification.deleteMany({
				where: { type: twoFAVerificationType, target: userId },
			})
			break
		}
		default: {
			return json({ status: 'error', message: 'Invalid intent' } as const)
		}
	}
	return json({ status: 'success' } as const)
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>()
	const toggle2FAFetcher = useFetcher<typeof action>()

	return (
		<div className="flex flex-col gap-4">
			{data.is2FAEnabled ? (
				<>
					<p className="text-sm">You have enabled two-factor authentication.</p>
					<toggle2FAFetcher.Form method="POST" preventScrollReset>
						<Button
							variant="secondary"
							size="md"
							type="submit"
							name="intent"
							value="disable"
							status={toggle2FAFetcher.state === 'loading' ? 'pending' : 'idle'}
							className="mx-auto"
						>
							Disable 2FA
						</Button>
					</toggle2FAFetcher.Form>
				</>
			) : (
				<>
					<p>You have not enabled two-factor authentication yet.</p>
					<p className="text-sm">
						Two factor authentication adds an extra layer of security to your
						account. You will need to enter a code from an authenticator app
						like <a href="https://1password.com/">1Password</a> to log in.
					</p>
					<toggle2FAFetcher.Form method="POST" preventScrollReset>
						<Button
							variant="primary"
							size="md"
							type="submit"
							name="intent"
							value="enable"
							status={toggle2FAFetcher.state === 'loading' ? 'pending' : 'idle'}
							className="mx-auto"
						>
							Enable 2FA
						</Button>
					</toggle2FAFetcher.Form>
				</>
			)}
		</div>
	)
}
