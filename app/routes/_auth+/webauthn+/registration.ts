import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getDomainUrl, getErrorMessage } from '#app/utils/misc.tsx'
import { type Route } from './+types/registration.ts'
import {
	PasskeyCookieSchema,
	RegistrationResponseSchema,
	passkeyCookie,
	getWebAuthnConfig,
} from './utils.server.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const passkeys = await prisma.passkey.findMany({
		where: { userId },
		select: { id: true },
	})
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: { email: true, name: true, username: true },
	})

	const config = getWebAuthnConfig(request)
	const options = await generateRegistrationOptions({
		rpName: config.rpName,
		rpID: config.rpID,
		userName: user.username,
		userID: new TextEncoder().encode(userId),
		userDisplayName: user.name ?? user.email,
		attestationType: 'none',
		excludeCredentials: passkeys,
		authenticatorSelection: config.authenticatorSelection,
	})

	return Response.json(
		{ options },
		{
			headers: {
				'Set-Cookie': await passkeyCookie.serialize(
					PasskeyCookieSchema.parse({
						challenge: options.challenge,
						userId: options.user.id,
					}),
				),
			},
		},
	)
}

export async function action({ request }: Route.ActionArgs) {
	try {
		const userId = await requireUserId(request)

		const body = await request.json()
		const result = RegistrationResponseSchema.safeParse(body)
		if (!result.success) {
			throw new Error('Invalid registration response')
		}

		const data = result.data

		// Get challenge from cookie
		const passkeyCookieData = await passkeyCookie.parse(
			request.headers.get('Cookie'),
		)
		const parsedPasskeyCookieData =
			PasskeyCookieSchema.safeParse(passkeyCookieData)
		if (!parsedPasskeyCookieData.success) {
			throw new Error('No challenge found')
		}
		const { challenge, userId: webauthnUserId } = parsedPasskeyCookieData.data

		const domain = new URL(getDomainUrl(request)).hostname
		const rpID = domain
		const origin = getDomainUrl(request)

		const verification = await verifyRegistrationResponse({
			response: data,
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpID,
			requireUserVerification: true,
		})

		const { verified, registrationInfo } = verification
		if (!verified || !registrationInfo) {
			throw new Error('Registration verification failed')
		}
		const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
			registrationInfo

		const existingPasskey = await prisma.passkey.findUnique({
			where: { id: credential.id },
			select: { id: true },
		})

		if (existingPasskey) {
			throw new Error('This passkey has already been registered')
		}

		// Create new passkey in database
		await prisma.passkey.create({
			data: {
				id: credential.id,
				aaguid,
				publicKey: Buffer.from(credential.publicKey),
				userId,
				webauthnUserId,
				counter: credential.counter,
				deviceType: credentialDeviceType,
				backedUp: credentialBackedUp,
				transports: credential.transports?.join(','),
			},
		})

		return Response.json({ status: 'success' } as const, {
			headers: {
				'Set-Cookie': await passkeyCookie.serialize('', { maxAge: 0 }),
			},
		})
	} catch (error) {
		if (error instanceof Response) throw error

		return Response.json(
			{ status: 'error', error: getErrorMessage(error) } as const,
			{ status: 400 },
		)
	}
}
