import { expect, type Page } from '@playwright/test'

interface ExpectURLProps {
	page: Page
	url: string | RegExp
}

export async function expectURL({ page, url }: ExpectURLProps) {
	await expect(page).toHaveURL(url)
}

interface ExpectLoginUrlProps {
	page: Page
	redirectTo?: string
}

export async function expectLoginUrl({
	page,
	redirectTo,
}: ExpectLoginUrlProps) {
	const expectedUrl = redirectTo
		? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
		: '/login'
	await expectURL({ page, url: expectedUrl })
	// await expectURL({ page, url: '/login' })
}
