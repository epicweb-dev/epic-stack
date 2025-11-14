import { createCookieSessionStorage } from 'react-router'
import { ENV } from 'varlock/env'

export const verifySessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_verification',
		sameSite: 'lax', // CSRF protection is advised if changing to 'none'
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		secrets: [ENV.SESSION_SECRET],
		secure: ENV.NODE_ENV === 'production',
	},
})
