import { faker } from '@faker-js/faker'
import { expect, test } from '../playwright-utils.ts'

test('Users can create notes', async ({ login, page }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNewNote()
	await page.locator("//a[text()='+ New Note']").click()

	// blank form submission should result in errors
	await page.locator('button[type="submit"]').click()
	await expect(page.locator('ul#note-editor-title-error')).toBeVisible()
	await expect(page.locator('ul#note-editor-content-error')).toBeVisible()

	// fill in form and submit
	await page.locator('input[name="title"]').fill(newNote.title)
	await page.locator('textarea[name="content"]').fill(newNote.content)
	await page.locator('button[type="submit"]').click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/*`))
})

test('Users can edit notes', async ({ login, page }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	// create a note
	const newNote = createNewNote()
	await page.locator("//a[text()='+ New Note']").click()

	await page.locator('input[name="title"]').fill(newNote.title)
	await page.locator('textarea[name="content"]').fill(newNote.content)
	await page.locator('button[type="submit"]').click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/*`))

	// edit the note
	await page.locator("//a[text()='Edit']").click()
	const updatedNote = createNewNote()
	await page.locator('input[name="title"]').fill(updatedNote.title)
	await page.locator('textarea[name="content"]').fill(updatedNote.content)
	await page.locator('button[type="submit"]').click()

	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/*`))
	await expect(page.locator('h2')).toHaveText(updatedNote.title)
})

test('Users can delete notes', async ({ login, page }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNewNote()
	await page.locator("//a[text()='+ New Note']").click()

	await page.locator('input[name="title"]').fill(newNote.title)
	await page.locator('textarea[name="content"]').fill(newNote.content)
	await page.locator('button[type="submit"]').click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/*`))
	await expect(page.locator('h2')).toHaveText(newNote.title)
	// count links on page

	// find links with  href prefix
	let countBefore = await page.locator('ul>li>a').count()
	await page.locator("//div[text()='Delete']").click()
	await expect(page).toHaveURL(`/users/${user.username}/notes`)
	let countAfter = await page.locator('ul>li>a').count()
	expect(countAfter).toEqual(countBefore - 1)
})

function createNewNote() {
	return {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	}
}
