import { type Request } from '@playwright/test'
import { expect, test } from '#tests/playwright-utils.ts'

test('Test root error boundary caught', async ({ page }) => {
	const pageUrl = '/does-not-exist'
	await page.goto(pageUrl)

	await expect(page.getByText(/We can't find this page/i)).toBeVisible()

	const listener = (request: Request) => {
		if (request.url().includes(pageUrl)) {
			request.response().then(response => expect(response?.status()).toBe(404))
		}
	}

	page.on('request', listener)
})
