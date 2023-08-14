import * as setCookieParser from 'set-cookie-parser'
import { sessionKey } from '~/utils/auth.server.ts'
import { sessionStorage } from '~/utils/session.server.ts'

export const BASE_URL = 'https://www.epicstack.dev'

export function convertSetCookieToCookie(setCookie: string) {
	const parsedCookie = setCookieParser.parseString(setCookie)
	return new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()
}

export async function getSessionSetCookieHeader(
	session: { id: string },
	existingCookie?: string,
) {
	const cookieSession = await sessionStorage.getSession(existingCookie)
	cookieSession.set(sessionKey, session.id)
	const setCookieHeader = await sessionStorage.commitSession(cookieSession)
	return setCookieHeader
}

export async function getSessionCookieHeader(
	session: { id: string },
	existingCookie?: string,
) {
	const setCookieHeader = await getSessionSetCookieHeader(
		session,
		existingCookie,
	)
	return convertSetCookieToCookie(setCookieHeader)
}
