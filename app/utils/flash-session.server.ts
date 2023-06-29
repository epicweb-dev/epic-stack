import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { randomUUID } from 'crypto'
import type { ToastProps } from '~/components/ui/toast.tsx'

const FLASH_SESSION = 'flash'

export type ToastMessage = {
	title: string
	variant?: ToastProps['variant']
	description?: string
}

interface FlashSessionValues {
	confetti?: string
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

const getSessionFromRequest = (request: Request) => {
	const cookie = request.headers.get('Cookie')

	return sessionStorage.getSession(cookie)
}
/**
 * Helper method used to redirect the user to a new page with flash session values
 * @param url Url to redirect to
 * @param flash Flash session values
 * @param init Response options
 * @returns Redirect response
 */
export const redirectWithFlash = async (
	url: string,
	flash: FlashSessionValues,
	init?: ResponseInit,
) => {
	const session = await sessionStorage.getSession()
	session.flash(FLASH_SESSION, flash)
	const headers = new Headers(init?.headers)
	const flashCookie = await sessionStorage.commitSession(session)
	// We append the flash cookie to the session
	headers.append('Set-Cookie', flashCookie)

	return redirect(url, {
		...init,
		headers,
	})
}
/**
 * Helper method used to redirect the user to a new page with confetti raining down
 * @param url Redirect URL
 * @param init Additional response options
 * @returns Returns a redirect response with confetti stored in the session
 */
export const redirectWithConfetti = async (url: string, init?: ResponseInit) =>
	await redirectWithFlash(url, { confetti: randomUUID() }, init)

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
	const session = await getSessionFromRequest(request)
	const flash = session.get(FLASH_SESSION) as FlashSessionValues | undefined
	const headers = { 'Set-Cookie': await sessionStorage.commitSession(session) }
	// Headers need to be returned to purge the flash storage
	return { flash, headers }
}
