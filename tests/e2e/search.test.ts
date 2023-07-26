import { invariant } from '~/utils/misc.tsx'
import { expect, insertNewUser, test } from '../playwright-utils.ts'

test('Search from home page', async ({ page }) => {
	const newUser = await insertNewUser({
		username: '___very_unique_username___',
	})
	invariant(newUser.name, 'User must have a name')
	await page.goto('/')

	await page.getByRole('searchbox', { name: /search/i }).fill(newUser.username)
	await page.getByRole('button', { name: /search/i }).click()

	await page.waitForURL(`/users?search=${newUser.username}`)
	await expect(page.getByText('Epic Notes Users')).toBeVisible()
	const userList = page.getByRole('main').getByRole('list')
	await expect(userList.getByRole('listitem')).toHaveCount(1) // should show 1 result
	await expect(page.getByAltText(newUser.name)).toBeVisible()

	await page.getByRole('searchbox', { name: /search/i }).fill('__nonexistent__')
	await page.getByRole('button', { name: /search/i }).click()
	await page.waitForURL(`/users?search=__nonexistent__`)

	await expect(userList.getByRole('listitem')).not.toBeVisible()
	await expect(page.getByText(/no users found/i)).toBeVisible()
})
