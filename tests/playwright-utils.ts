import { invariant } from '@epic-web/invariant'
import { test as base } from '@playwright/test'
import { eq, type InferSelectModel, sql } from 'drizzle-orm'
import * as setCookieParser from 'set-cookie-parser'
import {
	getPasswordHash,
	getSessionExpirationDate,
	sessionKey,
} from '#app/utils/auth.server.ts'
import { drizzle } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB_HEADER } from '#app/utils/providers/constants.js'
import { normalizeEmail } from '#app/utils/providers/provider.js'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { Password, Role, RoleToUser, Session, User } from '#drizzle/schema.ts'
import { createUser } from './db-utils.ts'
import {
	type GitHubUser,
	deleteGitHubUser,
	insertGitHubUser,
} from './mocks/github.ts'

export * from './db-utils.ts'

type GetOrInsertUserOptions = {
	id?: string
	username?: InferSelectModel<typeof User>['username']
	password?: string
	email?: InferSelectModel<typeof User>['email']
}

type User = {
	id: string
	email: string
	username: string
	name: string | null
}

async function getOrInsertUser({
	id,
	username,
	password,
	email,
}: GetOrInsertUserOptions = {}): Promise<User> {
	if (id) {
		const user = await drizzle.query.User.findFirst({
			columns: { id: true, email: true, username: true, name: true },
			where: eq(User.id, id),
		})
		invariant(user, 'User not found')
		return user
	} else {
		const userData = createUser()
		username ??= userData.username
		password ??= userData.username
		email ??= userData.email
		const [user] = await drizzle
			.insert(User)
			.values({
				...userData,
				email,
				username,
			})
			.returning({
				id: User.id,
				email: User.email,
				username: User.username,
				name: User.name,
			})
		invariant(user, 'Failed to create user')
		await drizzle.insert(RoleToUser).select(
			drizzle
				.select({
					roleId: Role.id,
					userId: sql.raw(`'${user.id}'`).as('userId'),
				})
				.from(Role)
				.where(eq(Role.name, 'user')),
		)
		await drizzle.insert(Password).values({
			hash: await getPasswordHash(password),
			userId: user.id,
		})
		return user
	}
}

export const test = base.extend<{
	insertNewUser(options?: GetOrInsertUserOptions): Promise<User>
	login(options?: GetOrInsertUserOptions): Promise<User>
	prepareGitHubUser(): Promise<GitHubUser>
}>({
	insertNewUser: async ({}, use) => {
		let userId: string | undefined = undefined
		await use(async (options) => {
			const user = await getOrInsertUser(options)
			userId = user.id
			return user
		})
		await drizzle.delete(User).where(eq(User.id, userId!))
	},
	login: async ({ page }, use) => {
		let userId: string | undefined = undefined
		await use(async (options) => {
			const user = await getOrInsertUser(options)
			userId = user.id
			const [session] = await drizzle
				.insert(Session)
				.values({
					expirationDate: getSessionExpirationDate(),
					userId: user.id,
				})
				.returning({ id: Session.id })
			invariant(session, 'Failed to create session')

			const authSession = await authSessionStorage.getSession()
			authSession.set(sessionKey, session.id)
			const cookieConfig = setCookieParser.parseString(
				await authSessionStorage.commitSession(authSession),
			)
			const newConfig = {
				...cookieConfig,
				domain: 'localhost',
				expires: cookieConfig.expires?.getTime(),
				sameSite: cookieConfig.sameSite as 'Strict' | 'Lax' | 'None',
			}
			await page.context().addCookies([newConfig])
			return user
		})
		await drizzle.delete(User).where(eq(User.id, userId!))
	},
	prepareGitHubUser: async ({ page }, use, testInfo) => {
		await page.route(/\/auth\/github(?!\/callback)/, async (route, request) => {
			const headers = {
				...request.headers(),
				[MOCK_CODE_GITHUB_HEADER]: testInfo.testId,
			}
			await route.continue({ headers })
		})

		let ghUser: GitHubUser | null = null
		await use(async () => {
			const newGitHubUser = await insertGitHubUser(testInfo.testId)!
			ghUser = newGitHubUser
			return newGitHubUser
		})

		const [user] = await drizzle
			.select({ id: User.id, name: User.name })
			.from(User)
			.where(eq(User.email, normalizeEmail(ghUser!.primaryEmail)))
		invariant(user, 'User not found')
		await drizzle.delete(Session).where(eq(Session.userId, user.id))
		await drizzle.delete(User).where(eq(User.id, user.id))
		await deleteGitHubUser(ghUser!.primaryEmail)
	},
})
export const { expect } = test

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
		await new Promise((r) => setTimeout(r, 100))
	}
	throw lastError
}
