import { faker } from '@faker-js/faker'
import { type NoteImage, type Note } from '@prisma/client'
import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test('Users can create note with an image', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()
	await navigate('/users/:username/notes', { username: user.username })

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
	await expect(
		page.getByRole('region', { name: newNote.title }).getByAltText(altText),
	).toBeVisible()
})

test('Users can create note with multiple images', async ({
	page,
	navigate,
	login,
}) => {
	const user = await login()
	await navigate('/users/:username/notes', { username: user.username })

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

test('Users can edit note image', async ({ page, navigate, login }) => {
	const user = await login()

	const note = await prisma.note.create({
		select: { id: true },
		data: {
			...createNoteWithImage(),
			ownerId: user.id,
		},
	})
	await navigate('/users/:username/notes/:noteId', {
		username: user.username,
		noteId: note.id,
	})

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

test('Users can delete note image', async ({ page, navigate, login }) => {
	const user = await login()

	const note = await prisma.note.create({
		select: { id: true, title: true },
		data: {
			...createNoteWithImage(),
			ownerId: user.id,
		},
	})
	await navigate('/users/:username/notes/:noteId', {
		username: user.username,
		noteId: note.id,
	})

	await expect(page.getByRole('heading', { name: note.title })).toBeVisible()
	const images = page
		.getByRole('region', { name: note.title })
		.getByRole('list')
		.getByRole('listitem')
		.getByRole('img')
	await expect(images).toHaveCount(1)
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	await page.getByRole('button', { name: 'remove image' }).click()
	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(`/users/${user.username}/notes/${note.id}`)
	await expect(images).toHaveCount(0)
})

function createNote() {
	return {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	} satisfies Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'ownerId'>
}

function createNoteWithImage() {
	return {
		...createNote(),
		images: {
			create: {
				altText: 'cute koala',
				objectKey: 'kody-notes/cute-koala.png',
			},
		},
	} satisfies Omit<
		Note,
		'id' | 'createdAt' | 'updatedAt' | 'type' | 'ownerId'
	> & {
		images: {
			create: Pick<NoteImage, 'altText' | 'objectKey'>
		}
	}
}
