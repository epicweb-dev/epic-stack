import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import type { ToastProps } from '~/components/ui/toast.tsx'

const FLASH_SESSION = 'flash'

const toastMessageSchema = z.object({
	title: z.string(),
	variant: z.custom<ToastProps['variant']>().optional(),
	description: z.string().optional(),
})

const flashSessionValuesSchema = z.object({
	confetti: z.string().optional(),
	toast: toastMessageSchema.optional(),
})

export type ToastMessage = z.infer<typeof toastMessageSchema>
type FlashSessionValues = z.infer<typeof flashSessionValuesSchema>

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

function getSessionFromRequest(request: Request) {
	const cookie = request.headers.get('Cookie')

	return sessionStorage.getSession(cookie)
}

/**
 * Helper method used to add flash session values to the session
 */
export async function flashMessage(
	flash: FlashSessionValues,
	headers?: ResponseInit['headers'],
) {
	const session = await sessionStorage.getSession()
	session.flash(FLASH_SESSION, flash)
	const cookie = await sessionStorage.commitSession(session)
	const newHeaders = new Headers(headers)
	newHeaders.append('Set-Cookie', cookie)
	return newHeaders
}

/**
 * Helper method used to redirect the user to a new page with flash session values
 * @param url Url to redirect to
 * @param flash Flash session values
 * @param init Response options
 * @returns Redirect response
 */
export async function redirectWithFlash(
	url: string,
	flash: FlashSessionValues,
	init?: ResponseInit,
) {
	return redirect(url, {
		...init,
		headers: await flashMessage(flash, init?.headers),
	})
}
/**
 * Helper method used to redirect the user to a new page with confetti raining down
 * If thrown needs to be awaited
 * @param url Redirect URL
 * @param init Additional response options
 * @returns Returns a redirect response with confetti stored in the session
 */
export function redirectWithConfetti(url: string, init?: ResponseInit) {
	return redirectWithFlash(url, { confetti: randomUUID() }, init)
}

/**
 * Helper method used to redirect the user to a new page with a toast notification
 * If thrown it needs to be awaited
 * @param url Redirect URL
 * @param init Additional response options
 * @returns Returns a redirect response with toast stored in the session
 */
export function redirectWithToast(
	url: string,
	toast: ToastMessage,
	init?: ResponseInit,
) {
	return redirectWithFlash(url, { toast }, init)
}

/**
 * Helper method used to get the confetti flag from the session and show it to the user
 * @param request Request object
 * @returns Returns the confetti flag from the session and headers to purge the flash storage
 */
export async function getFlashSession(request: Request) {
	const session = await getSessionFromRequest(request)
	const result = flashSessionValuesSchema.safeParse(session.get(FLASH_SESSION))
	const flash = result.success ? result.data : undefined
	const headers = new Headers({
		'Set-Cookie': await sessionStorage.commitSession(session),
	})
	// Headers need to be returned to purge the flash storage
	return { flash, headers }
}
