import { expect, test } from '#tests/playwright-utils.ts'
import { expectLoginUrl, expectUrl } from '#tests/utils/url-utils.ts'
import { expectAdminUsersPage, goToAdminUsersPage } from './users-utils.ts'

test.describe('User cannot view Admin users page', () => {
	test('when not logged in', async ({ page }) => {
		await goToAdminUsersPage(page)
		await expectLoginUrl({ page, redirectTo: '/admin/users' })
	})

	test('when logged in as user', async ({ page, login }) => {
		await login()
		await goToAdminUsersPage(page)
		await expectUrl({ page, url: '/' })
	})
})

test.describe('User can view Admin users', () => {
	test('when logged in as admin', async ({ page, login }) => {
		const user = await login({ roles: ['user', 'admin'] })
		await goToAdminUsersPage(page)
		await expectAdminUsersPage(page)

		await expect(page.getByRole('main').getByText('Admin Users')).toBeVisible()
		console.log(user)
		// TODO: add user list
		// await expect(page.getByRole('main').getByText(user.username)).toBeVisible()
	})
})
