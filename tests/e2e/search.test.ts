import { APP_TITLE } from '#app/utils/branding.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test('Search from home page', async ({ page, navigate, insertNewUser }) => {
	const newUser = await insertNewUser()
	await navigate('/')

	// Search for an existing user.
	await page.getByRole('searchbox', { name: /search/i }).fill(newUser.username)
	await page.getByRole('button', { name: /search/i }).click()

	await expect(page.getByText(`${APP_TITLE} Users`)).toBeVisible()
	const userList = page.getByRole('main').getByRole('list')
	await expect(userList.getByRole('listitem')).toHaveCount(1)
	await expect(
		userList.getByRole('listitem').getByRole('link', {
			name: `${newUser.name || newUser.username} profile`,
		}),
	).toBeVisible()

	// Search for a non-existing user.
	await page.getByRole('searchbox', { name: /search/i }).fill('__nonexistent__')
	await page.getByRole('button', { name: /search/i }).click()
	await page.waitForURL(`/users?search=__nonexistent__`)

	await expect(userList.getByRole('listitem')).not.toBeVisible()
	await expect(page.getByText(/no users found/i)).toBeVisible()
})
