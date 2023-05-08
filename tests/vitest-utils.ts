import { authenticator } from '~/utils/auth.server'
import { commitSession, getSession } from '~/utils/session.server'

export const BASE_URL = 'https://epicstack.dev'

export async function getUserSetCookieHeader(
	user: { id: string },
	existingCookie?: string,
) {
	const session = await getSession(existingCookie)
	session.set(authenticator.sessionKey, user.id)
	const setCookieHeader = await commitSession(session)
	return setCookieHeader
}
