import { expect, type Page } from '@playwright/test'

interface ExpectURLProps {
	page: Page
	url: string | RegExp
}

export async function expectURL({ page, url }: ExpectURLProps) {
	await expect(page).toHaveURL(url)
}
