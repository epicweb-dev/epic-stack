import { type Page } from '@playwright/test'
import * as setCookieParser from 'set-cookie-parser'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { sessionStorage } from '#app/utils/session.server.ts'
import { type User } from './db-utils.ts'

export * from './db-utils.ts'

export async function loginPage({
	page,
	user,
}: {
	page: Page
	user: User
}) {
	const session = await prisma.session.create({
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		},
		select: { id: true },
	})

	const cookieSession = await sessionStorage.getSession()
	cookieSession.set(sessionKey, session.id)
	const cookieConfig = setCookieParser.parseString(
		await sessionStorage.commitSession(cookieSession),
	) as any
	await page.context().addCookies([{ ...cookieConfig, domain: 'localhost' }])
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
