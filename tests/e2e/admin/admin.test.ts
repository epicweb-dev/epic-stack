import { test } from '#tests/playwright-utils.ts'
import { expectLoginUrl, expectUrl } from '#tests/utils/url-utils.ts'
import { expectAdminPage, goToAdminPage } from './admin-utils.ts'

test.describe('User cannot view Admin', () => {
	test('when not logged in', async ({ page }) => {
		await goToAdminPage(page)
		await expectLoginUrl({ page, redirectTo: '/admin' })
	})

	test('when logged in as user', async ({ page, login }) => {
		await login()
		await goToAdminPage(page)
		await expectUrl({ page, url: '/' })
	})
})

test.describe('User can view Admin', () => {
	test('when logged in as admin', async ({ page, login }) => {
		await login({ roles: ['user', 'admin'] })
		await goToAdminPage(page)
		await expectAdminPage(page)
	})
})
