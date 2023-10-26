import { expect, type Page } from '@playwright/test'
import { type User } from '@prisma/client'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/misc.tsx'
import {
	expectButton,
	expectLink,
	expectNoButton,
	expectNoLink,
	goTo,
} from '#tests/utils/page-utils.ts'
import { expectURL } from '#tests/utils/url-utils.ts'

export async function goToUserPage(page: Page, username: string) {
	await goTo(page, `/users/${username}`)
}

export async function expectUserPage(page: Page, username: string) {
	const url = `/users/${username}`
	await expectURL({ page, url })
}

async function getUser(username: string) {
	return await prisma.user.findFirst({
		where: { username },
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
			roles: { select: { name: true, permissions: true } },
		},
	})
}

export async function expectUserContent(
	page: Page,
	username: User['username'],
) {
	const user = await getUser(username)
	if (user) {
		await expectUserHeading(page, user.name || user.username)
		await expectUserJoinedDate(page, user.createdAt)
	}
}

async function expectUserHeading(page: Page, username: string) {
	await expect(
		page.getByRole('heading', { name: username, exact: true }),
	).toBeVisible()
}

async function expectUserJoinedDate(page: Page, date: Date) {
	const dateFormatted = `Joined ${formatDate(date)}`
	await expect(page.getByText(dateFormatted, { exact: false })).toBeVisible()
}

export async function expectMyUserContent(
	page: Page,
	username: User['username'],
) {
	const user = await getUser(username)
	if (user) {
		await expectButton(page, 'Logout')
		await expectLink(page, 'My notes')
		await expectLink(page, 'Edit profile')
	}
}

export async function expectNotMyUserContent(
	page: Page,
	username: User['username'],
) {
	const user = await getUser(username)
	if (user) {
		await expectNoButton(page, 'Logout')
		await expectLink(page, `${user.name}'s notes`)
		await expectNoLink(page, 'Edit profile')
	}
}
