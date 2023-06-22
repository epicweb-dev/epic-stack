import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { type TypeOptions } from 'react-toastify'

const FLASH_SESSION = 'flash'

export type ToastMessage = {
	text: string
	type: TypeOptions
}

interface FlashSessionValues {
	confetti?: boolean
	toast?: ToastMessage
}

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: FLASH_SESSION,
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

export const redirectWithFlash = async (
	url: string,
	flash: FlashSessionValues,
	init?: ResponseInit,
) => {
	const session = await sessionStorage.getSession()
	session.flash(FLASH_SESSION, flash)
	// Convert the type so we can easily access the Set-Cookie header
	const headers = init?.headers as
		| Record<string, string | undefined>
		| undefined
	const additionalCookies = headers?.['Set-Cookie']
	const flashCookie = await sessionStorage.commitSession(session)

	return redirect(url, {
		...init,
		headers: {
			...init?.headers,
			'Set-Cookie': [additionalCookies, flashCookie].filter(Boolean).join('; '),
		},
	})
}
/**
 * Helper method used to redirect the user to a new page with confetti raining down
 * @param url Redirect URL
 * @param init Additional response options
 * @returns Returns a redirect response with confetti stored in the session
 */
export const redirectWithConfetti = (url: string, init?: ResponseInit) =>
	redirectWithFlash(url, { confetti: true }, init)

/**
 * Helper method used to redirect the user to a new page with a toast notification
 * @param url Redirect URL
 * @param init Additional response options
 * @returns Returns a redirect response with toast stored in the session
 */
export const redirectWithToast = (
	url: string,
	toast: ToastMessage,
	init?: ResponseInit,
) => redirectWithFlash(url, { toast }, init)

/**
 * Helper method used to get the confetti flag from the session and show it to the user
 * @param request Request object
 * @returns Returns the confetti flag from the session and headers to purge the flash storage
 */
export const getFlashSession = async (request: Request) => {
	const session = await getSession(request)
	const flash = session.get(FLASH_SESSION) as FlashSessionValues | undefined
	const headers = { 'Set-Cookie': await sessionStorage.commitSession(session) }
	// Headers need to be returned to purge the flash storage
	return { flash, headers }
}
