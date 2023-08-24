import { Honeypot } from 'remix-utils'

export const honeypot = new Honeypot({
	encryptionSeed: process.env.HONEYPOT_SECRET,
})
