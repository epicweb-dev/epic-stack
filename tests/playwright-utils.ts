import { test as base, type Page } from '@playwright/test'
import { parse } from 'cookie'
import { authenticator, getPasswordHash } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { createUser } from '../tests/db-utils.ts'

export const dataCleanup = {
	users: new Set<string>(),
}

export function deleteUserByUsername(username: string) {
	return prisma.user.delete({ where: { username } })
}

export async function insertNewUser({
	username,
	password,
}: { username?: string; password?: string } = {}) {
	const userData = createUser()
	username = username ?? userData.username
	const user = (await prisma.user
		.create({
			data: {
				...userData,
				username,
				password: {
					create: {
						hash: await getPasswordHash(password || userData.username),
					},
				},
			},
			select: { id: true, name: true, username: true, email: true },
		})
		.catch(async err => {
			// sometimes the tests fail before data cleanup can happen. So we'll just
			// delete the user and try again.
			if (
				err instanceof Error &&
				err.message.includes(
					'Unique constraint failed on the fields: (`username`)',
				)
			) {
				await prisma.user.delete({ where: { username } })
				return insertNewUser({ username, password })
			} else {
				throw err
			}
		})) as { id: string; name: string; username: string; email: string }
	dataCleanup.users.add(user.id)
	return user
}

export const test = base.extend<{
	login: (user?: { id: string }) => ReturnType<typeof loginPage>
}>({
	login: [
		async ({ page, baseURL }, use) => {
			await use(user => loginPage({ page, baseURL, user }))
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
	const session = await prisma.session.create({
		data: {
			expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			userId: user.id,
		},
		select: { id: true },
	})

	const cookieSession = await getSession()
	cookieSession.set(authenticator.sessionKey, session.id)
	const cookieValue = await commitSession(cookieSession)
	const { _session } = parse(cookieValue)
	await page.context().addCookies([
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

/**
 * This allows you to wait for something (like an email to be available).
 *
 * It calls the callback every 50ms until it returns a value (and does not throw
 * an error). After the timeout, it will throw the last error that was thrown or
 * throw the error message provided as a fallback
 */
export async function waitFor<ReturnValue>(
	cb: () => ReturnValue | Promise<ReturnValue>,
	{
		errorMessage,
		timeout = 5000,
	}: { errorMessage?: string; timeout?: number } = {},
) {
	const endTime = Date.now() + timeout
	let lastError: unknown = new Error(errorMessage)
	while (Date.now() < endTime) {
		try {
			const response = await cb()
			if (response) return response
		} catch (e: unknown) {
			lastError = e
		}
		await new Promise(r => setTimeout(r, 100))
	}
	throw lastError
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
