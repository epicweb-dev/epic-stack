import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { Outlet } from 'react-router'
import { Icon } from '#app/components/ui/icon.tsx'
import { type VerificationTypes } from '#app/routes/_auth/verify.tsx'
import { type BreadcrumbHandle } from '../../profile/_layout.tsx'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="lock-closed">2FA</Icon>,
	getSitemapEntries: () => null,
}

export const twoFAVerificationType = '2fa' satisfies VerificationTypes

export default function TwoFactorRoute() {
	return <Outlet />
}
