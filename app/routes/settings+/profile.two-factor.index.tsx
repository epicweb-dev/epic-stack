import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { generateTOTP } from '@epic-web/totp'
import { shouldRequestTwoFA } from '../resources+/login.tsx'
import { twoFAVerificationType } from './profile.two-factor.tsx'
import { verificationType as verifyVerificationType } from './profile.two-factor.verify.tsx'

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: userId },
		select: { id: true },
	})
	const shouldReverify = await shouldRequestTwoFA(request)
	return json({ is2FAEnabled: Boolean(verification), shouldReverify })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
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

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>()
	const toggle2FAFetcher = useFetcher<typeof action>()

	return (
		<div className="flex flex-col gap-4">
			{data.is2FAEnabled ? (
				<>
					<p className="text-lg">
						<Icon name="check">
							You have enabled two-factor authentication.
						</Icon>
					</p>
					<Link to="disable">
						<Icon name="lock-open-1">Disable 2FA</Icon>
					</Link>
				</>
			) : (
				<>
					<p>
						<Icon name="lock-open-1">
							You have not enabled two-factor authentication yet.
						</Icon>
					</p>
					<p className="text-sm">
						Two factor authentication adds an extra layer of security to your
						account. You will need to enter a code from an authenticator app
						like{' '}
						<a className="underline" href="https://1password.com/">
							1Password
						</a>{' '}
						to log in.
					</p>
					<toggle2FAFetcher.Form method="POST" preventScrollReset>
						<StatusButton
							type="submit"
							name="intent"
							value="enable"
							status={toggle2FAFetcher.state === 'loading' ? 'pending' : 'idle'}
							className="mx-auto"
						>
							Enable 2FA
						</StatusButton>
					</toggle2FAFetcher.Form>
				</>
			)}
		</div>
	)
}
