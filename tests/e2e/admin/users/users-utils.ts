import { type Page } from '@playwright/test'
import { goTo } from '#tests/utils/page-utils.ts'
import { expectUrl } from '#tests/utils/url-utils.ts'

export async function goToAdminUsersPage(page: Page) {
	await goTo(page, '/admin/users')
}

export async function expectAdminUsersPage(page: Page) {
	await expectUrl({ page, url: '/admin/users' })
}
