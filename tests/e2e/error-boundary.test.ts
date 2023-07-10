import { expect, test } from '../playwright-utils.ts'

test('Test root error boundary caught', async ({ login, page }) => {
	await page.goto('/does-not-exist')

	await expect(page.getByText(/We can't find that page/i)).toBeVisible()
})
