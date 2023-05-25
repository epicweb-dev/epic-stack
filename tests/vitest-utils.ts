import { authenticator } from '~/utils/auth.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'

export const BASE_URL = 'https://epicstack.dev'

export async function getSessionSetCookieHeader(
	session: { id: string },
	existingCookie?: string,
) {
	const cookieSession = await getSession(existingCookie)
	cookieSession.set(authenticator.sessionKey, session.id)
	const setCookieHeader = await commitSession(cookieSession)
	return setCookieHeader
}
