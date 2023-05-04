import { test as base, type Page } from '@playwright/test'
import { parse } from 'cookie'
import { authenticator, getPasswordHash } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { commitSession, getSession } from '~/utils/session.server'
import { createUser } from '../prisma/seed-utils'

export const dataCleanup = {
	users: new Set<string>(),
}

export { readEmail } from '../mocks/utils'

export function deleteUserByUsername(username: string) {
	return prisma.user.delete({ where: { username } })
}

export async function insertNewUser({ password }: { password?: string } = {}) {
	const userData = createUser()
	const user = await prisma.user.create({
		data: {
			...userData,
			password: {
				create: {
					hash: await getPasswordHash(password || userData.username),
				},
			},
		},
		select: { id: true, name: true, username: true, email: true },
	})
	dataCleanup.users.add(user.id)
	return user
}

export const test = base.extend<{
	login: (user?: { id: string }) => ReturnType<typeof loginPage>
}>({
	login: [
		async ({ page, baseURL }, use) => {
			use(user => loginPage({ page, baseURL, user }))
		},
		{ auto: true },
	],
})

export const { expect } = test

export async function loginPage({
	page,
	baseURL = `http://localhost:${process.env.PORT}/`,
	user: givenUser,
}: {
	page: Page
	baseURL: string | undefined
	user?: { id: string }
}) {
	const user = givenUser
		? await prisma.user.findUniqueOrThrow({
				where: { id: givenUser.id },
				select: {
					id: true,
					email: true,
					username: true,
					name: true,
				},
		  })
		: await insertNewUser()

	const session = await getSession()
	session.set(authenticator.sessionKey, user.id)
	const cookieValue = await commitSession(session)
	const { _session } = parse(cookieValue)
	page.context().addCookies([
		{
			name: '_session',
			sameSite: 'Lax',
			url: baseURL,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			value: _session,
		},
	])
	return user
}

test.afterEach(async () => {
	type Delegate = {
		deleteMany: (opts: {
			where: { id: { in: Array<string> } }
		}) => Promise<unknown>
	}
	async function deleteAll(items: Set<string>, delegate: Delegate) {
		if (items.size > 0) {
			await delegate.deleteMany({
				where: { id: { in: [...items] } },
			})
		}
	}
	await deleteAll(dataCleanup.users, prisma.user)
})
