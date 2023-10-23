import { prisma } from '#app/utils/db.server.ts'
import { compareStringsIgnoreLineBreaks } from '#app/utils/misc.tsx'
import { test, expect } from '#tests/playwright-utils.ts'
import { clickLink, fillSubmitForm, goTo } from '#tests/utils/page-utils.ts'
import { expectURL } from '#tests/utils/url-utils.ts'
import { type TestNote, createNote } from './notes-utils.ts'

test.describe('Users cannot create notes', () => {
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

test('Users can create notes', async ({ page, login }) => {
	const user = await login()
	await goTo(page, `/users/${user.username}/notes`)

	const newNote = createNote()
	await clickLink(page, 'New Note')

	await fillSubmitForm({
		page,
		fields: [
			{ role: 'textbox', name: 'title', value: newNote.title },
			{ role: 'textbox', name: 'content', value: newNote.content },
		],
		submit: true,
	})

	// successful redirect
	await expectURL({ page, url: new RegExp(`/users/${user.username}/notes/.*`) })

	// Check if the new note exists in the database
	await expectNoteCreated(newNote)
})

async function expectNoteCreated({ title, content }: TestNote) {
	const noteInDb = await prisma.note.findFirst({
		where: { title: title },
		select: { title: true, content: true },
	})
	await expect(noteInDb).toBeTruthy()
	expect(
		compareStringsIgnoreLineBreaks(noteInDb?.content || '', content),
	).toBeTruthy()
}
