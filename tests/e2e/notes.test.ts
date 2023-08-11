import { faker } from '@faker-js/faker'
import { expect, test } from '../playwright-utils.ts'

test('Users can create notes', async ({ login, page }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNewNote()
	await page.getByRole('link', { name: /New Note/i }).click()

	// blank form submission should result in errors
	await page.getByRole('button', { name: /submit/i }).click()
	// count errors
	await expect(
		page.getByText('Required'),
	).toHaveCount(2)

	// fill in form and submit
	await page.getByRole('textbox', { name: /title/i }).fill(newNote.title)
	await page.getByRole('textbox', { name: /content/i }).fill(newNote.content)

	await page.getByRole('button', { name: /submit/i }).click()
	await expect(page.getByText('Note created', { exact: true })).toBeVisible()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
})

test('Users can edit notes', async ({ login, page }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	// create a note
	const newNote = createNewNote()
	await page.getByRole('link', { name: /New Note/i }).click()

	await page.getByRole('textbox', { name: /title/i }).fill(newNote.title)
	await page.getByRole('textbox', { name: /content/i }).fill(newNote.content)
	await page.getByRole('button', { name: /submit/i }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))

	// edit the note
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	const updatedNote = createNewNote()
	await page.getByRole('textbox', { name: /title/i }).fill(updatedNote.title)
	await page
		.getByRole('textbox', { name: /content/i })
		.fill(updatedNote.content)
	await page.getByRole('button', { name: /submit/i }).click()
	await expect(page.getByText('Note updated', { exact: true })).toBeVisible()

	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(
		page.getByRole('heading', { name: updatedNote.title }),
	).toBeVisible()
})

test('Users can delete notes', async ({ login, page }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createNewNote()
	await page.getByRole('link', { name: /New Note/i }).click()

	await page.getByRole('textbox', { name: /title/i }).fill(newNote.title)
	await page.getByRole('textbox', { name: /content/i }).fill(newNote.content)
	await page.getByRole('button', { name: /submit/i }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(page.getByRole('heading', { name: newNote.title })).toBeVisible()
	// count links on page

	// find links with href prefix
	const noteLinks = page
		.getByRole('main')
		.getByRole('list')
		.getByRole('listitem')
		.getByRole('link')
	const countBefore = await noteLinks.count()
	await page.getByRole('button', { name: /delete/i }).click()
	await expect(page.getByText('Note deleted', { exact: true })).toBeVisible()
	await expect(page).toHaveURL(`/users/${user.username}/notes`)
	const countAfter = await noteLinks.count()
	expect(countAfter).toEqual(countBefore - 1)
})

function createNewNote() {
	return {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	}
}
