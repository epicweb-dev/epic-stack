import { createCookieSessionStorage } from '@remix-run/node'

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_session',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: process.env.SESSION_SECRET.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
})

const {
	getSession,
	commitSession: rootCommitSession,
	destroySession,
} = sessionStorage
export { getSession, destroySession }

// we have to do this because every time you commit the session you overwrite it
// so we store the expiration time in the cookie and reset it every time we commit
export async function commitSession(
	...args: Parameters<typeof rootCommitSession>
) {
	const [session, options] = args
	if (options?.expires) {
		session.set('expires', options.expires)
	}
	const expires = session.get('expires')
		? new Date(session.get('expires'))
		: undefined
	return rootCommitSession(session, { expires, ...options })
}
