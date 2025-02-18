import { test as base, Locator } from '@playwright/test'
import { type User as UserModel } from '@prisma/client'
import * as setCookieParser from 'set-cookie-parser'
import {
	getPasswordHash,
	getSessionExpirationDate,
	sessionKey,
} from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB_HEADER } from '#app/utils/providers/constants.js'
import { normalizeEmail } from '#app/utils/providers/provider.js'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { createUser } from './db-utils.ts'
import {
	type GitHubUser,
	deleteGitHubUser,
	insertGitHubUser,
} from './mocks/github.ts'
import { sleep } from '#app/utils/misc.tsx'

export * from './db-utils.ts'

type GetOrInsertUserOptions = {
	id?: string
	username?: UserModel['username']
	password?: string
	email?: UserModel['email']
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
	const select = { id: true, email: true, username: true, name: true }
	if (id) {
		return await prisma.user.findUniqueOrThrow({
			select,
			where: { id: id },
		})
	} else {
		const userData = createUser()
		username ??= userData.username
		password ??= userData.username
		email ??= userData.email
		return await prisma.user.create({
			select,
			data: {
				...userData,
				email,
				username,
				roles: { connect: { name: 'user' } },
				password: { create: { hash: await getPasswordHash(password) } },
			},
		})
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
		await prisma.user.delete({ where: { id: userId } }).catch(() => {})
	},
	login: async ({ page }, use) => {
		let userId: string | undefined = undefined
		await use(async (options) => {
			const user = await getOrInsertUser(options)
			userId = user.id
			const session = await prisma.session.create({
				data: {
					expirationDate: getSessionExpirationDate(),
					userId: user.id,
				},
				select: { id: true },
			})

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
		await prisma.user.deleteMany({ where: { id: userId } })
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

		const user = await prisma.user.findUniqueOrThrow({
			select: { id: true, name: true },
			where: { email: normalizeEmail(ghUser!.primaryEmail) },
		})
		await prisma.user.delete({ where: { id: user.id } })
		await prisma.session.deleteMany({ where: { userId: user.id } })
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

type ActionFunction<T> = () => Promise<T>
type VerifyFunction = () => Promise<boolean>

interface RetryOptions {
	maxAttempts?: number
	actionInterval?: number
	verifyInterval?: number
	timeout?: number
	actionName?: string
}

/**
 * some actions seem to sometimes fail in reliably achieving the expected result under `fullyParallel` mode.
 * This ensures it gets correctly done.
 */
async function reliableAction<T>(
	action: ActionFunction<T>,
	verify: VerifyFunction,
	options: RetryOptions = {},
) {
	const {
		maxAttempts = 3,
		actionInterval = 100,
		verifyInterval = 50,
		timeout = 1000,
		actionName = 'action',
	} = options

	for (let i = 0; i < maxAttempts; i++) {
		const isLastAttempt = i === maxAttempts - 1

		try {
			console.debug(`attempt ${i + 1}`)
			await action()

			await new Promise((r) => setTimeout(r, 50))

			const verifyPromise = new Promise<boolean>(async (resolve) => {
				let timedout = false
				setTimeout(() => {
					timedout = true
				}, timeout)

				while (!timedout) {
					if (await verify()) {
						resolve(true)
						return
					}
					await sleep(verifyInterval)
				}
				resolve(false)
			})

			if (await verifyPromise) {
				return
			}
		} catch (e) {
			if (isLastAttempt) throw e
		}

		if (!isLastAttempt) {
			await sleep(actionInterval)
		}
	}

	throw new Error(
		`Failed to perform ${actionName} after ${maxAttempts} attempts`,
	)
}

/**
 * `locator.check` seems to sometimes fail in reliably changing the checkbox state under `fullyParallel` mode.
 * This ensures it gets correctly updated to the “checked” state.
 */
export async function reliableCheck(locator: Locator, options?: RetryOptions) {
	return reliableAction(
		() => locator.check(),
		() => locator.isChecked(),
		{ actionName: 'check', ...options },
	)
}

/**
 * `locator.setInputFiles` seems to sometimes fail in reliably set the input files under `fullyParallel` mode.
 * This ensures it gets correctly set.
 */
export async function reliableSetInputFiles(
	locator: Locator,
	files: string[],
	options?: RetryOptions,
) {
	return reliableAction(
		() => locator.setInputFiles(files),
		async () => {
			const count = await locator.evaluate((el) => {
				const input = el as HTMLInputElement
				return input.files?.length || 0
			})
			return count === files.length
		},
		{ actionName: 'file upload', ...options },
	)
}
