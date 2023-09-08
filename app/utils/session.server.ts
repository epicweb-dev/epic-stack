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

// we have to do this because every time you commit the session you overwrite it
// so we store the expiration time in the cookie and reset it every time we commit
export async function commitSession(
	...args: Parameters<typeof sessionStorage.commitSession>
) {
	const [session, options] = args
	if (options?.expires) {
		session.set('expires', options.expires)
	}
	if (options?.maxAge) {
		session.set('expires', new Date(Date.now() + options.maxAge * 1000))
	}
	const expires = session.get('expires')
		? new Date(session.get('expires'))
		: undefined
	const setCookieHeader = await sessionStorage.commitSession(session, {
		expires,
		...options,
	})
	return setCookieHeader
}
