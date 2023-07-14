import { Outlet } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'

export const handle = {
	breadcrumb: <Icon name="lock-closed">2FA</Icon>,
}

export const twoFAVerificationType = '2fa'

export default function TwoFactorRoute() {
	return <Outlet />
}
