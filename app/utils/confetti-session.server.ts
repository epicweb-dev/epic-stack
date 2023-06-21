import { createCookieSessionStorage } from '@remix-run/node'
import { redirect } from '@remix-run/router'

const CONFETTI_SESSION = 'confetti'

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: CONFETTI_SESSION,
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: [process.env.SESSION_SECRET],
		secure: process.env.NODE_ENV === 'production',
	},
})

const getSession = (request: Request) => {
	const cookie = request.headers.get('Cookie')
	return sessionStorage.getSession(cookie)
}

/**
 * Helper method used to redirect the user to a new page with confetti raining down
 * @param url Redirect URL
 * @param init Additional response options
 * @returns Returns a redirect response with confetti stored in the session
 */
export const redirectWithConfetti = async (
	url: string,
	init?: ResponseInit,
) => {
	const session = await sessionStorage.getSession()
	// Sets the confetti flag in the session
	session.flash(CONFETTI_SESSION, true)
	return redirect(url, {
		...init,
		headers: {
			...init?.headers,
			'Set-Cookie': await sessionStorage.commitSession(session),
		},
	})
}

/**
 * Helper method used to get the confetti flag from the session and show it to the user
 * @param request Request object
 * @returns Returns the confetti flag from the session and headers to purge the flash storage
 */
export const getConfetti = async (request: Request) => {
	const session = await getSession(request)
	const confetti = session.get(CONFETTI_SESSION) as boolean | undefined
	const headers = { 'Set-Cookie': await sessionStorage.commitSession(session) }
	// Headers need to be returned to purge the flash storage
	return { confetti, headers }
}
