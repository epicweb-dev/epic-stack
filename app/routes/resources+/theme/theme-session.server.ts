import * as cookie from 'cookie'

const cookieName = 'theme'
type Theme = 'light' | 'dark' | undefined

export function getTheme(request: Request): Theme {
	const cookieHeader = request.headers.get('Cookie')
	const parsed = cookieHeader ? cookie.parse(cookieHeader)[cookieName] : 'light'
	if (parsed === 'light' || parsed === 'dark') return parsed
	return undefined
}

export function setTheme(theme?: Theme) {
	if (theme) {
		return cookie.serialize(cookieName, theme, { path: '/' })
	} else {
		return cookie.serialize(cookieName, '', { path: '/', maxAge: 0 })
	}
}
