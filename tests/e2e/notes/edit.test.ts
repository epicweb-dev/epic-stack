import { test } from '#tests/playwright-utils.ts'
import { clickLink, expectNoButton } from '#tests/utils/page-utils.ts'
import {
	createNote,
	createPrismaNote,
	expectFieldInvalid,
	expectNoteEditPage,
	expectNoteHeading,
	expectNotePage,
	fillAndSubmitNoteForm,
	goToUserNote,
} from './notes-utils.ts'

test.describe('Users cannot edit notes', () => {
	test.describe('when not authorized', () => {
		// test('when not logged in', async ({ page, login }) => {
		// 	await goTo(page, '/users/username/notes/edit')
		// 	await expectURL({ page, url: /\/login/ })
		// })

		test('when logged in as another user', async ({ page, login }) => {
			const user = await login()
			const note = await createPrismaNote(user.id)

			// login as another user
			await login()

			// go to note from first user
			await goToUserNote(page, user.username, note.id)
			await expectNoButton(page, 'Edit')
		})
	})

	test.describe('when form is incomplete', () => {
		test('when title is missing', async ({ page, login }) => {
			const user = await login()
			const note = await createPrismaNote(user.id)

			await goToUserNote(page, user.username, note.id)
			await clickLink(page, 'Edit')

			const newNote = createNote()
			await fillAndSubmitNoteForm(page, '', newNote.content)

			await expectNoteEditPage(page, user.username, note.id)
			await expectFieldInvalid(page, 'title')
		})

		test('when content is missing', async ({ page, login }) => {
			const user = await login()
			const note = await createPrismaNote(user.id)

			await goToUserNote(page, user.username, note.id)
			await clickLink(page, 'Edit')

			const newNote = createNote()
			await fillAndSubmitNoteForm(page, newNote.title, '')

			await expectNoteEditPage(page, user.username, note.id)
			await expectFieldInvalid(page, 'content')
		})
	})
})

test.describe('Users can edit notes', () => {
	test('with completed form', async ({ page, login }) => {
		const user = await login()
		const note = await createPrismaNote(user.id)

		await goToUserNote(page, user.username, note.id)
		await clickLink(page, 'Edit')

		const newNote = createNote()
		await fillAndSubmitNoteForm(page, newNote.title, newNote.content)

		await expectNotePage(page, user.username, note.id)
		await expectNoteHeading(page, newNote.title)
	})

	// https://playwright.dev/docs/api/class-filechooser
	test('with completed form and an image', async ({ page, login }) => {})
})
