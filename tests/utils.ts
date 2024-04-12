import * as setCookieParser from 'set-cookie-parser'

import { sessionKey } from '#app/utils/auth.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'

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
	const authSession = await authSessionStorage.getSession(existingCookie)
	authSession.set(sessionKey, session.id)
	const setCookieHeader = await authSessionStorage.commitSession(authSession)
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
