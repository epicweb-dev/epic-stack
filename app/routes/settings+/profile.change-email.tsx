import { Outlet } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { type VerificationTypes } from '../resources+/verify.tsx'

export const handle = {
	breadcrumb: <Icon name="envelope-closed">Change Email</Icon>,
}

export const twoFAVerificationType = 'change-email' satisfies VerificationTypes

export default function TwoFactorRoute() {
	return <Outlet />
}
