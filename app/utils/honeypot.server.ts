import { Honeypot, SpamError } from 'remix-utils'

export const honeypot = new Honeypot({
	encryptionSeed: process.env.HONEYPOT_SECRET,
})

export function checkHoneypot(formData: FormData) {
	try {
		honeypot.check(formData)
	} catch (error) {
		if (error instanceof SpamError) {
			throw new Response('Form not submitted properly', { status: 400 })
		}
		throw error
	}
}
