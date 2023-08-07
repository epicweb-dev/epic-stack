import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { useDoubleCheck } from '~/utils/misc.tsx'
import { useUser } from '~/utils/user.ts'
import { shouldRequestTwoFA } from '../resources+/login.tsx'
import { Verify } from '../resources+/verify.tsx'
import { twoFAVerificationType } from './profile.two-factor.tsx'

export const handle = {
	breadcrumb: <Icon name="lock-open-1">Disable</Icon>,
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: userId },
		select: { id: true },
	})
	if (!verification) {
		return redirect('/settings/profile/two-factor')
	}
	const shouldReverify = await shouldRequestTwoFA(request)
	return json({ shouldReverify })
}

export async function action({ request }: DataFunctionArgs) {
	if (await shouldRequestTwoFA(request)) {
		// looks like they waited too long enter the email
		return redirectWithToast(request.url, {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		})
	}
	const userId = await requireUserId(request)
	await prisma.verification.deleteMany({
		where: { type: twoFAVerificationType, target: userId },
	})
	return json({ status: 'success' } as const)
}

export default function TwoFactorDisableRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useUser()
	const toggle2FAFetcher = useFetcher<typeof action>()
	const dc = useDoubleCheck()

	return (
		<div className="mx-auto max-w-sm">
			{data.shouldReverify ? (
				<>
					<p>Please reverify your account by submitting your 2FA code</p>
					<Verify target={user.id} type="2fa" />
				</>
			) : (
				<toggle2FAFetcher.Form method="POST" preventScrollReset>
					<p>
						Disabling two factor authentication is not recommended. However, if
						you would like to do so, click here:
					</p>
					<StatusButton
						variant="destructive"
						status={toggle2FAFetcher.state === 'loading' ? 'pending' : 'idle'}
						{...dc.getButtonProps({
							className: 'mx-auto',
							name: 'intent',
							value: 'disable',
							type: 'submit',
						})}
					>
						{dc.doubleCheck ? 'Are you sure?' : 'Disable 2FA'}
					</StatusButton>
				</toggle2FAFetcher.Form>
			)}
		</div>
	)
}
