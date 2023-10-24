import { test, expect } from '#tests/playwright-utils.ts'
import { clickLink, goTo } from '#tests/utils/page-utils.ts'
import { expectURL } from '#tests/utils/url-utils.ts'
import {
	createNote,
	expectCreatedNotePage,
	expectFieldInvalid,
	expectNewNotePage,
	expectNoteHeading,
	fillAndSubmitNoteForm,
	goToUserNotes,
} from './notes-utils.ts'

test.describe('Users cannot create notes', () => {
	test.describe('when not authorized', () => {
		test('when not logged in', async ({ page, login }) => {
			await goTo(page, '/users/username/notes/new')
			await expectURL({ page, url: /\/login/ })
		})

		// TODO: what to do when this happens?
		// test('when logged in as another user', async ({ page, login }) => {
		// 	const user = await login()
		// 	const anotherUser = await login()
		// 	await goTo(page, `/users/${anotherUser.username}/notes/new`)
		// 	await expectURL({ page, url: new RegExp(`/users/${user.username}/notes`) })
		// })
	})

	test.describe('when form is incomplete', () => {
		test('when title is missing', async ({ page, login }) => {
			const user = await login()

			await goToUserNotes(page, user.username)
			await clickLink(page, 'New Note')

			const newNote = createNote()
			await fillAndSubmitNoteForm(page, '', newNote.content)

			await expectNewNotePage(page, user.username)
			await expectFieldInvalid(page, 'title')
		})

		test('when content is missing', async ({ page, login }) => {
			const user = await login()

			await goToUserNotes(page, user.username)
			await clickLink(page, 'New Note')

			const newNote = createNote()
			await fillAndSubmitNoteForm(page, newNote.title, '')

			await expectNewNotePage(page, user.username)
			await expectFieldInvalid(page, 'content')
		})
	})
})

test.describe('Users can create notes', () => {
	test('with completed form', async ({ page, login }) => {
		const user = await login()

		await goToUserNotes(page, user.username)
		await clickLink(page, 'New Note')

		// find links with href prefix
		const noteLinks = page
			.getByRole('main')
			.getByRole('list')
			.getByRole('listitem')
			.getByRole('link')
		const countBefore = await noteLinks.count()

		const newNote = createNote()
		await fillAndSubmitNoteForm(page, newNote.title, newNote.content)

		await expectCreatedNotePage(page, user.username)
		await expectNoteHeading(page, newNote.title)

		// check for new note in list
		const countAfter = await noteLinks.count()
		expect(countAfter).toEqual(countBefore + 1)
	})

	// https://playwright.dev/docs/api/class-filechooser
	test('with completed form and an image', async ({ page, login }) => {})
})
