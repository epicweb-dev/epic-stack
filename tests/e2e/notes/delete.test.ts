import { test, expect } from '#tests/playwright-utils.ts'
import { clickButton } from '#tests/utils/page-utils.ts'
import {
	createPrismaNote,
	expectNoButton,
	expectNotesPage,
	goToUserNote,
} from './notes-utils.ts'

test.describe('Users cannot delete notes', () => {
	test.describe('when not authorized', () => {
		// TODO: no username exists error
		// test('when not logged in', async ({ page, login }) => {
		// 	await goTo(page, '/users/username/notes')
		// 	await expectURL({ page, url: /\/login/ })
		// })

		test('when logged in as another user', async ({ page, login }) => {
			const user = await login()
			const note = await createPrismaNote(user.id)

			// login as another user
			await login()

			// go to note from first user
			await goToUserNote(page, user.username, note.id)
			await expectNoButton(page, 'Delete')
		})
	})
})

test.describe('Users can delete notes', () => {
	test('when your note', async ({ page, login }) => {
		const user = await login()
		const note = await createPrismaNote(user.id)

		await goToUserNote(page, user.username, note.id)

		// find links with href prefix
		const noteLinks = page
			.getByRole('main')
			.getByRole('list')
			.getByRole('listitem')
			.getByRole('link')
		const countBefore = await noteLinks.count()

		clickButton(page, 'Delete')

		// check for success message
		await expect(
			page.getByText('Your note has been deleted.', { exact: true }),
		).toBeVisible()

		await expectNotesPage(page, user.username)

		// check for note count
		const countAfter = await noteLinks.count()
		expect(countAfter).toEqual(countBefore - 1)
	})
})
