import {
	type AuthenticationResponseJSON,
	type RegistrationResponseJSON,
} from '@simplewebauthn/server'
import { createCookie } from 'react-router'
import { z } from 'zod'
import { getDomainUrl } from '#app/utils/misc.tsx'

export const passkeyCookie = createCookie('webauthn-challenge', {
	path: '/',
	sameSite: 'lax',
	httpOnly: true,
	maxAge: 60 * 60 * 2,
	secure: process.env.NODE_ENV === 'production',
	secrets: [process.env.SESSION_SECRET],
})

export const PasskeyCookieSchema = z.object({
	challenge: z.string(),
	userId: z.string(),
})

export const RegistrationResponseSchema = z.object({
	id: z.string(),
	rawId: z.string(),
	response: z.object({
		clientDataJSON: z.string(),
		attestationObject: z.string(),
		transports: z
			.array(
				z.enum([
					'ble',
					'cable',
					'hybrid',
					'internal',
					'nfc',
					'smart-card',
					'usb',
				]),
			)
			.optional(),
	}),
	authenticatorAttachment: z.enum(['cross-platform', 'platform']).optional(),
	clientExtensionResults: z.object({
		credProps: z
			.object({
				rk: z.boolean(),
			})
			.optional(),
	}),
	type: z.literal('public-key'),
}) satisfies z.ZodType<RegistrationResponseJSON>

const AuthenticationResponseSchema = z.object({
	id: z.string(),
	rawId: z.string(),
	response: z.object({
		clientDataJSON: z.string(),
		authenticatorData: z.string(),
		signature: z.string(),
		userHandle: z.string().optional(),
	}),
	type: z.literal('public-key'),
	clientExtensionResults: z.object({
		appid: z.boolean().optional(),
		credProps: z
			.object({
				rk: z.boolean().optional(),
			})
			.optional(),
		hmacCreateSecret: z.boolean().optional(),
	}),
}) satisfies z.ZodType<AuthenticationResponseJSON>

export const PasskeyLoginBodySchema = z.object({
	authResponse: AuthenticationResponseSchema,
	remember: z.boolean().default(false),
	redirectTo: z.string().nullable(),
})

export function getWebAuthnConfig(request: Request) {
	const url = new URL(getDomainUrl(request))
	return {
		rpName: url.hostname,
		rpID: url.hostname,
		origin: url.origin,
		authenticatorSelection: {
			residentKey: 'preferred',
			userVerification: 'preferred',
		},
	} as const
}
