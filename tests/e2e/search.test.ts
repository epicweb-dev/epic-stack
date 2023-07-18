import { expect, test } from '../playwright-utils.ts'

test('Search from home page', async ({ page }) => {
	await page.goto('/')

	await page.getByRole('searchbox', { name: /search/i }).fill('kody')
	await page.getByRole('button', { name: /search/i }).click()

	await page.waitForURL('/users?search=kody')
	await expect(page.getByText('Epic Notes Users')).toBeVisible()
	await expect(page.locator('ul>li>a')).toHaveCount(1) // should show 1 result
	await expect(page.getByAltText('Kody')).toBeVisible()
})

test('Search from users page', async ({ page }) => {
	await page.goto('/users')
	const countBefore = await page.locator('ul>li>a').count()
	await expect(countBefore, 'should load all results').toBeGreaterThanOrEqual(1)

	await page.getByRole('searchbox', { name: /search/i }).fill('kody')
	await page.getByRole('button', { name: /search/i }).click()

	await page.waitForURL('/users?search=kody')
	await expect(page.getByText('Epic Notes Users')).toBeVisible()
	await expect(page.locator('ul>li>a')).toHaveCount(1) // should show 1 result
	await expect(page.getByAltText('Kody')).toBeVisible()
})
