import * as cookie from 'cookie'

const key = 'redirectTo'
export const destroyRedirectToHeader = cookie.serialize(key, '', { maxAge: -1 })

export function getRedirectCookieHeader(redirectTo?: string) {
	return redirectTo && redirectTo !== '/'
		? cookie.serialize(key, redirectTo, { maxAge: 60 * 10 })
		: null
}

export function getRedirectCookieValue(request: Request) {
	const rawCookie = request.headers.get('cookie')
	const parsedCookies = rawCookie ? cookie.parse(rawCookie) : {}
	const redirectTo = parsedCookies[key]
	return redirectTo || null
}
