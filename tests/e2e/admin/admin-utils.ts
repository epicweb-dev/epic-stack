import { type Page } from '@playwright/test'
import { goTo } from '#tests/utils/page-utils.ts'
import { expectUrl } from '#tests/utils/url-utils.ts'

export async function goToAdminPage(page: Page) {
	await goTo(page, '/admin')
}

export async function expectAdminPage(page: Page) {
	await expectUrl({ page, url: '/admin' })
}
