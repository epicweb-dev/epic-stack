import * as setCookieParser from 'set-cookie-parser'

export function convertSetCookieToCookie(setCookie: string) {
	const parsedCookie = setCookieParser.parseString(setCookie)
	return new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()
}

// export async function getSessionSetCookieHeader(
// 	session: { id: string },
// 	existingCookie?: string,
// ) {
// 	const authSession = await authSessionStorage.getSession(existingCookie)
// 	authSession.set(sessionKey, session.id)
//
// 	return await authSessionStorage.commitSession(authSession)
// }
//
// export async function getSessionCookieHeader(
// 	session: { id: string },
// 	existingCookie?: string,
// ) {
// 	const setCookieHeader = await getSessionSetCookieHeader(
// 		session,
// 		existingCookie,
// 	)
// 	return convertSetCookieToCookie(setCookieHeader)
// }
