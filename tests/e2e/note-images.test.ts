import fs from 'node:fs'
import { invariant } from '@epic-web/invariant'
import { faker } from '@faker-js/faker'
import { type InferInsertModel } from 'drizzle-orm'
import { drizzle } from '#app/utils/db.server.ts'
import { Note, NoteImage } from '#drizzle/schema'
import { expect, test } from '#tests/playwright-utils.ts'

test('Users can create note with an image', async ({ page, login }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNote()
	const altText = 'cute koala'
	await page.getByRole('link', { name: 'new note' }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: 'title' }).fill(newNote.title)
	await page.getByRole('textbox', { name: 'content' }).fill(newNote.content)
	await page
		.getByLabel('image')
		.nth(0)
		.setInputFiles('tests/fixtures/images/kody-notes/cute-koala.png')
	await page.getByRole('textbox', { name: 'alt text' }).fill(altText)

	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(page.getByRole('heading', { name: newNote.title })).toBeVisible()
	await expect(page.getByAltText(altText)).toBeVisible()
})

test('Users can create note with multiple images', async ({ page, login }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNote()
	const altText1 = 'cute koala'
	const altText2 = 'koala coder'
	await page.getByRole('link', { name: 'new note' }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: 'title' }).fill(newNote.title)
	await page.getByRole('textbox', { name: 'content' }).fill(newNote.content)
	await page
		.getByLabel('image')
		.nth(0)
		.setInputFiles('tests/fixtures/images/kody-notes/cute-koala.png')
	await page.getByLabel('alt text').nth(0).fill(altText1)
	await page.getByRole('button', { name: 'add image' }).click()

	await page
		.getByLabel('image')
		.nth(1)
		.setInputFiles('tests/fixtures/images/kody-notes/koala-coder.png')
	await page.getByLabel('alt text').nth(1).fill(altText2)

	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(page.getByRole('heading', { name: newNote.title })).toBeVisible()
	await expect(page.getByAltText(altText1)).toBeVisible()
	await expect(page.getByAltText(altText2)).toBeVisible()
})

test('Users can edit note image', async ({ page, login }) => {
	const user = await login()

	const [note] = await drizzle
		.insert(Note)
		.values({
			...createNote(),
			ownerId: user.id,
		})
		.returning({ id: Note.id })
	invariant(note, 'Failed to create note')
	await drizzle
		.insert(NoteImage)
		.values({
			...createNoteImage(),
			noteId: note.id,
		})
		.returning({ id: NoteImage.id })

	await page.goto(`/users/${user.username}/notes/${note.id}`)

	// edit the image
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	const updatedImage = {
		altText: 'koala coder',
		location: 'tests/fixtures/images/kody-notes/koala-coder.png',
	}
	await page.getByLabel('image').nth(0).setInputFiles(updatedImage.location)
	await page.getByLabel('alt text').nth(0).fill(updatedImage.altText)
	await page.getByRole('button', { name: 'submit' }).click()

	await expect(page).toHaveURL(`/users/${user.username}/notes/${note.id}`)
	await expect(page.getByAltText(updatedImage.altText)).toBeVisible()
})

test('Users can delete note image', async ({ page, login }) => {
	const user = await login()

	const [note] = await drizzle
		.insert(Note)
		.values({
			...createNote(),
			ownerId: user.id,
		})
		.returning({ id: Note.id, title: Note.title })
	invariant(note, 'Failed to create note')
	await drizzle.insert(NoteImage).values({
		...createNoteImage(),
		noteId: note.id,
	})

	await page.goto(`/users/${user.username}/notes/${note.id}`)

	await expect(page.getByRole('heading', { name: note.title })).toBeVisible()
	// find image tags
	const images = page
		.getByRole('main')
		.getByRole('list')
		.getByRole('listitem')
		.getByRole('img')
	const countBefore = await images.count()
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	await page.getByRole('button', { name: 'remove image' }).click()
	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(`/users/${user.username}/notes/${note.id}`)
	const countAfter = await images.count()
	expect(countAfter).toEqual(countBefore - 1)
})

function createNote() {
	return {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	} satisfies Omit<InferInsertModel<typeof Note>, 'id' | 'type' | 'ownerId'>
}
function createNoteImage() {
	return {
		altText: 'cute koala',
		contentType: 'image/png',
		blob: fs.readFileSync('tests/fixtures/images/kody-notes/cute-koala.png'),
	} satisfies Omit<InferInsertModel<typeof NoteImage>, 'noteId'>
}
