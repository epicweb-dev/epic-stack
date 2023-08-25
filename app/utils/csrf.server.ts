import { CSRF, CSRFError } from 'remix-utils'
import { createCookie } from '@remix-run/node'

const cookie = createCookie('csrf', {
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax',
	secrets: process.env.SESSION_SECRET.split(','),
})

export const csrf = new CSRF({
	cookie,
	formDataKey: 'csrf',
	secret: process.env.CSRF_SECRET,
})

export async function validateCSRF(formData: FormData, headers: Headers) {
	try {
		await csrf.validate(formData, headers)
	} catch (error) {
		if (error instanceof CSRFError) {
			throw new Response('Invalid CSRF token', { status: 403 })
		}
		throw error
	}
}
