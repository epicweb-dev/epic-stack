import { type RegistrationResponseJSON } from '@simplewebauthn/server'
import { decodeAttestationObject } from '@simplewebauthn/server/helpers'
import { createCookie } from 'react-router'
import { z } from 'zod'
import { getDomainUrl } from './misc.tsx'

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

function parseAuthData(authData: Uint8Array) {
	let pointer = 0

	// rpIdHash: SHA-256 hash of the RP ID
	const rpIdHash = authData.slice(pointer, pointer + 32)
	pointer += 32

	// flags: Bit flags indicating various attributes
	const flags = authData[pointer]
	pointer += 1

	// signCount: Signature counter, 32-bit unsigned big-endian integer
	const signCount = new DataView(authData.buffer).getUint32(pointer, false)
	pointer += 4

	// aaguid: Authenticator Attestation GUID, identifies the type of the authenticator
	const aaguid = authData.slice(pointer, pointer + 16)
	pointer += 16

	// credentialIdLength: Length of the credential ID, 16-bit unsigned big-endian integer
	const credentialIdLength = new DataView(authData.buffer).getUint16(
		pointer,
		false,
	)
	pointer += 2

	// credentialId: Credential identifier
	const credentialId = authData.slice(pointer, pointer + credentialIdLength)
	pointer += credentialIdLength

	// credentialPublicKey: The credential public key in COSE_Key format
	const credentialPublicKey = authData.slice(pointer)

	return {
		rpIdHash: Buffer.from(rpIdHash).toString('hex'),
		flags,
		signCount,
		aaguid: Buffer.from(aaguid)
			.toString('hex')
			.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
		credentialId: Buffer.from(credentialId).toString('hex'),
		credentialPublicKey: Buffer.from(credentialPublicKey),
	}
}

export function parseAttestationObject(attestationObject: string) {
	const attestationBuffer = new Uint8Array(
		Buffer.from(attestationObject, 'base64'),
	)
	const decodedAttestation = decodeAttestationObject(attestationBuffer)

	return {
		fmt: decodedAttestation.get('fmt'),
		attStmt: decodedAttestation.get('attStmt'),
		authData: parseAuthData(decodedAttestation.get('authData')),
	}
}
