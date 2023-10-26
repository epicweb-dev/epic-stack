import { createUser, test } from '#tests/playwright-utils.ts'
import { expectLink, expectNoLink } from '#tests/utils/page-utils.ts'
import { expectLoginUrl } from '#tests/utils/url-utils.ts'
import {
	expectMyUserContent,
	expectNotMyUserContent,
	expectUserContent,
	expectUserPage,
	goToUserPage,
} from './users-utils.ts'

test.describe('User cannot view user', () => {
	test('when not logged in', async ({ page }) => {
		const user = await createUser()

		await goToUserPage(page, user.username)
		await expectLoginUrl({ page, redirectTo: `/users/${user.username}` })
	})
})

test.describe('User can view user', () => {
	test.describe('when their own user page', () => {
		test('when the role is user', async ({ page, login }) => {
			const user = await login()

			await goToUserPage(page, user.username)
			await expectUserPage(page, user.username)

			await expectUserContent(page, user.username)
			await expectMyUserContent(page, user.username)
		})

		test('when the role is admin', async ({ page, login }) => {
			const user = await login({ roles: ['user', 'admin'] })

			await goToUserPage(page, user.username)
			await expectUserPage(page, user.username)

			await page.getByText('Admin')
			await expectLink(page, 'Admin')
		})
	})

	test.describe('when another user page', () => {
		test('when the role is user', async ({ page, login }) => {
			await login()
			const otherUser = await createUser()

			await goToUserPage(page, otherUser.username)
			await expectUserPage(page, otherUser.username)

			await expectUserContent(page, otherUser.username)
			await expectNotMyUserContent(page, otherUser.username)
		})

		test('when the role is admin', async ({ page, login, insertNewUser }) => {
			await login()
			const otherUser = await insertNewUser({ roles: ['user', 'admin'] })

			await goToUserPage(page, otherUser.username)
			await expectUserPage(page, otherUser.username)

			await page.getByText('Admin')
			await expectNoLink(page, 'Admin')
		})
	})
})
