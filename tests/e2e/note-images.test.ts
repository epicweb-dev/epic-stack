import fs from 'fs'
import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'
import { type NoteImage, type Note } from '@prisma/client'
import { prisma } from '#app/utils/db.server.ts'
import { loginPage } from '#tests/playwright-utils.ts'

test('Users can create note with an image', async ({ page }) => {
	const user = await loginPage({ page })
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNote()
	const altText = 'cute koala'
	await page.getByRole('link', { name: 'new note' }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: 'title' }).fill(newNote.title)
	await page.getByRole('textbox', { name: 'content' }).fill(newNote.content)
	await page.setInputFiles(
		"input[name='images[0].file']",
		'tests/fixtures/images/kody-notes/cute-koala.png',
	)
	await page.getByRole('textbox', { name: 'alt text' }).fill(altText)

	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(page.getByRole('heading', { name: newNote.title })).toBeVisible()
	await expect(page.getByAltText(altText)).toBeVisible()
})

test('Users can create note with multiple images', async ({ page }) => {
	const user = await loginPage({ page })
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNote()
	const altText1 = 'cute koala'
	const altText2 = 'koala coder'
	await page.getByRole('link', { name: 'new note' }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: 'title' }).fill(newNote.title)
	await page.getByRole('textbox', { name: 'content' }).fill(newNote.content)
	await page.setInputFiles(
		"input[name='images[0].file']",
		'tests/fixtures/images/kody-notes/cute-koala.png',
	)
	await page
		.locator('[id="note-editor-images\\[0\\]\\.altText"]')
		.fill(altText1)
	await page.getByRole('button', { name: 'add image' }).click()

	await page.setInputFiles(
		"input[name='images[1].file']",
		'tests/fixtures/images/kody-notes/koala-coder.png',
	)
	await page
		.locator('[id="note-editor-images\\[1\\]\\.altText"]')
		.fill(altText2)

	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(page.getByRole('heading', { name: newNote.title })).toBeVisible()
	await expect(page.getByAltText(altText1)).toBeVisible()
	await expect(page.getByAltText(altText2)).toBeVisible()
})

test('Users can edit note image', async ({ page }) => {
	const user = await loginPage({ page })

	const note = await prisma.note.create({
		select: { id: true },
		data: {
			...createNoteWithImage(),
			ownerId: user.id,
		},
	})
	await page.goto(`/users/${user.username}/notes/${note.id}`)

	// edit the image
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	const updatedImage = {
		altText: 'koala coder',
		url: 'tests/fixtures/images/kody-notes/koala-coder.png',
	}
	await page.setInputFiles("input[name='images[0].file']", updatedImage.url)
	await page
		.locator('[id="note-editor-images\\[0\\]\\.altText"]')
		.fill(updatedImage.altText)
	await page.getByRole('button', { name: 'submit' }).click()

	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(page.getByAltText(updatedImage.altText)).toBeVisible()
})

test('Users can delete note image', async ({ page }) => {
	const user = await loginPage({ page })

	const note = await prisma.note.create({
		select: { id: true, title: true },
		data: {
			...createNoteWithImage(),
			ownerId: user.id,
		},
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
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	const countAfter = await images.count()
	expect(countAfter).toEqual(countBefore - 1)
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
				contentType: 'image/png',
				blob: fs.readFileSync(
					'tests/fixtures/images/kody-notes/cute-koala.png',
				),
			},
		},
	} satisfies Omit<
		Note,
		'id' | 'createdAt' | 'updatedAt' | 'type' | 'ownerId'
	> & {
		images: { create: Pick<NoteImage, 'altText' | 'blob' | 'contentType'> }
	}
}
