import { invariant } from '@epic-web/invariant'
import { faker } from '@faker-js/faker'
import { drizzle } from '#app/utils/db.server.ts'
import { Note } from '#drizzle/schema'
import { expect, test } from '#tests/playwright-utils.ts'

test('Users can create notes', async ({ page, login }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNote()
	await page.getByRole('link', { name: /New Note/i }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: /title/i }).fill(newNote.title)
	await page.getByRole('textbox', { name: /content/i }).fill(newNote.content)

	await page.getByRole('button', { name: /submit/i }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
})

test('Users can edit notes', async ({ page, login }) => {
	const user = await login()

	const [note] = await drizzle
		.insert(Note)
		.values({
			...createNote(),
			ownerId: user.id,
		})
		.returning({ id: Note.id })
	invariant(note, 'Failed to create note')

	await page.goto(`/users/${user.username}/notes/${note.id}`)

	// edit the note
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	const updatedNote = createNote()
	await page.getByRole('textbox', { name: /title/i }).fill(updatedNote.title)
	await page
		.getByRole('textbox', { name: /content/i })
		.fill(updatedNote.content)
	await page.getByRole('button', { name: /submit/i }).click()

	await expect(page).toHaveURL(`/users/${user.username}/notes/${note.id}`)
	await expect(
		page.getByRole('heading', { name: updatedNote.title }),
	).toBeVisible()
})

test('Users can delete notes', async ({ page, login }) => {
	const user = await login()

	const [note] = await drizzle
		.insert(Note)
		.values({
			...createNote(),
			ownerId: user.id,
		})
		.returning({ id: Note.id })
	invariant(note, 'Failed to create note')

	await page.goto(`/users/${user.username}/notes/${note.id}`)

	// find links with href prefix
	const noteLinks = page
		.getByRole('main')
		.getByRole('list')
		.getByRole('listitem')
		.getByRole('link')
	const countBefore = await noteLinks.count()
	await page.getByRole('button', { name: /delete/i }).click()
	await expect(
		page.getByText('Your note has been deleted.', { exact: true }),
	).toBeVisible()
	await expect(page).toHaveURL(`/users/${user.username}/notes`)
	const countAfter = await noteLinks.count()
	expect(countAfter).toEqual(countBefore - 1)
})

function createNote() {
	return {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	}
}
