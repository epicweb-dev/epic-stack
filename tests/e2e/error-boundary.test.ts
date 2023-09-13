import { expect, test } from '#tests/playwright-utils.ts'

test('Test root error boundary caught', async ({ page }) => {
	await page.goto('/does-not-exist')

	await expect(page.getByText(/We can't find this page/i)).toBeVisible()
	// TODO: figure out how to assert the 404 status code
})
