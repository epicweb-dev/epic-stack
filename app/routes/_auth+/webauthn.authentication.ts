import {
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
	type AuthenticationResponseJSON,
} from '@simplewebauthn/server'
import { z } from 'zod'
import { getSessionExpirationDate } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getWebAuthnConfig, passkeyCookie } from '#app/utils/webauthn.server.ts'
import { type Route } from './+types/webauthn.authentication.ts'
import { handleNewSession } from './login.server.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const config = getWebAuthnConfig(request)
	const options = await generateAuthenticationOptions({
		rpID: config.rpID,
		userVerification: config.authenticatorSelection.userVerification,
	})

	const cookieHeader = await passkeyCookie.serialize({
		challenge: options.challenge,
	})

	return Response.json({ options }, { headers: { 'Set-Cookie': cookieHeader } })
}

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

export async function action({ request }: Route.ActionArgs) {
	const cookieHeader = request.headers.get('Cookie')
	const cookie = await passkeyCookie.parse(cookieHeader)
	const deletePasskeyCookie = await passkeyCookie.serialize('', { maxAge: 0 })
	try {
		if (!cookie?.challenge) {
			throw new Error('Authentication challenge not found')
		}

		const body = await request.json()
		const result = AuthenticationResponseSchema.safeParse(body)
		if (!result.success) {
			throw new Error('Invalid authentication response')
		}

		const passkey = await prisma.passkey.findUnique({
			where: { id: result.data.id },
			include: { user: true },
		})
		if (!passkey) {
			throw new Error('Passkey not found')
		}

		const config = getWebAuthnConfig(request)

		const verification = await verifyAuthenticationResponse({
			response: result.data,
			expectedChallenge: cookie.challenge,
			expectedOrigin: config.origin,
			expectedRPID: config.rpID,
			credential: {
				id: result.data.id,
				publicKey: passkey.publicKey,
				counter: Number(passkey.counter),
			},
		})

		if (!verification.verified) {
			throw new Error('Authentication verification failed')
		}

		// Update the authenticator's counter in the DB to the newest count
		await prisma.passkey.update({
			where: { id: passkey.id },
			data: { counter: BigInt(verification.authenticationInfo.newCounter) },
		})

		const session = await prisma.session.create({
			select: { id: true, expirationDate: true, userId: true },
			data: {
				expirationDate: getSessionExpirationDate(),
				userId: passkey.userId,
			},
		})

		const response = await handleNewSession(
			{
				request,
				session,
				// TODO: handle remember and redirectTo
				remember: false,
				redirectTo: '/',
			},
			{ headers: { 'Set-Cookie': deletePasskeyCookie } },
		)

		return response
	} catch (error) {
		if (error instanceof Response) throw error

		return Response.json(
			{
				status: 'error',
				error: error instanceof Error ? error.message : 'Verification failed',
			} as const,
			{ status: 400, headers: { 'Set-Cookie': deletePasskeyCookie } },
		)
	}
}
