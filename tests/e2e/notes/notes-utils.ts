import { faker } from '@faker-js/faker'
import { type Page } from '@playwright/test'
import { prisma } from '#app/utils/db.server.ts'
import { expect } from '#tests/playwright-utils.ts'
import { fillSubmitForm, goTo } from '#tests/utils/page-utils.ts'
import { expectURL } from '#tests/utils/url-utils.ts'

export interface TestNote {
	title: string
	content: string
}

export function createNote(): TestNote {
	return {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	}
}

export async function createPrismaNote(userId: string) {
	return await prisma.note.create({
		select: { id: true },
		data: { ...createNote(), ownerId: userId },
	})
}

export async function goToUserNotes(page: Page, username: string) {
	await goTo(page, `/users/${username}/notes`)
}

export async function goToUserNote(
	page: Page,
	username: string,
	noteId: string,
) {
	await goTo(page, `/users/${username}/notes/${noteId}`)
}

export async function fillAndSubmitNoteForm(
	page: Page,
	title: string,
	content: string,
) {
	await fillSubmitForm({
		page,
		fields: [
			{ role: 'textbox', name: 'title', value: title },
			{ role: 'textbox', name: 'content', value: content },
		],
		submit: true,
	})
}

export async function expectNotesPage(page: Page, username: string) {
	const url = `/users/${username}/notes`
	await expectURL({ page, url })
}

export async function expectNewNotePage(page: Page, username: string) {
	const url = `/users/${username}/notes/new`
	await expectURL({ page, url })
}

export async function expectCreatedNotePage(page: Page, username: string) {
	const url = new RegExp(`/users/${username}/notes/.*`)
	await expectURL({ page, url })
}

export async function expectNotePage(
	page: Page,
	username: string,
	noteId: string,
) {
	const url = `/users/${username}/notes/${noteId}`
	await expectURL({ page, url })
}

export async function expectNoteEditPage(
	page: Page,
	username: string,
	noteId: string,
) {
	const url = `/users/${username}/notes/${noteId}/edit`
	await expectURL({ page, url })
}

export async function expectFieldInvalid(page: Page, fieldName: string) {
	await expect(
		page.getByRole('textbox', { name: new RegExp(fieldName, 'i') }),
	).toHaveAttribute('aria-invalid', 'true')
}

export async function expectNoteHeading(page: Page, title: string) {
	await expect(
		page.getByRole('heading', { name: title, exact: true }),
	).toBeVisible()
}

export async function expectNoButton(page: Page, name: string) {
	await expect(page.getByRole('button', { name })).not.toBeVisible()
}

export async function getNoteLinks(page: Page) {
	return page
		.getByRole('main')
		.getByRole('list')
		.getByRole('listitem')
		.getByRole('link')
}
