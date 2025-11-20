import { Honeypot, SpamError } from 'remix-utils/honeypot/server'
import { ENV } from 'varlock/env'

export const honeypot = new Honeypot({
	validFromFieldName: ENV.NODE_ENV === 'test' ? null : undefined,
	encryptionSeed: ENV.HONEYPOT_SECRET,
})

export async function checkHoneypot(formData: FormData) {
	try {
		await honeypot.check(formData)
	} catch (error) {
		if (error instanceof SpamError) {
			throw new Response('Form not submitted properly', { status: 400 })
		}
		throw error
	}
}
