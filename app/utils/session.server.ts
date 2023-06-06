import { createCookieSessionStorage } from '@remix-run/node'

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '_session',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: [process.env.SESSION_SECRET],
		secure: process.env.NODE_ENV === 'production',
	},
})

export const { getSession, commitSession, destroySession } = sessionStorage

type Session = Awaited<ReturnType<typeof getSession>>

const themeKey = 'theme'

export function getTheme(session: Session): 'dark' | 'light' | null {
	const theme = session.get(themeKey)
	if (theme === 'dark' || theme === 'light') return theme
	return null
}

export function setTheme(session: Session, theme: 'dark' | 'light') {
	session.set(themeKey, theme)
}

export function deleteTheme(session: Session) {
	session.unset(themeKey)
}
