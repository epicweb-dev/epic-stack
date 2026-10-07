import { invariant } from '@epic-web/invariant'
import { type AppLoadContext } from 'react-router'
import { expect, test } from 'vitest'
import { loader as changeEmailLoader } from '#app/routes/settings/profile/change-email.tsx'
import { twoFAVerificationType } from '#app/routes/settings/profile/two-factor/_layout.tsx'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { generateTOTP } from '#app/utils/totp.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'
import { createUser } from '#tests/db-utils.ts'
import { BASE_URL, convertSetCookieToCookie } from '#tests/utils.ts'
import { type Route as ChangeEmailRoute } from '../settings/profile/+types/change-email.ts'
import { type Route } from './+types/verify.ts'
import {
	action,
	codeQueryParam,
	redirectToQueryParam,
	targetQueryParam,
	typeQueryParam,
} from './verify.tsx'

const ROUTE_PATH = '/verify'
const CHANGE_EMAIL_PATH = '/settings/profile/change-email'
const ACTION_ARGS_BASE = {
	params: {},
	context: {} as AppLoadContext,
	url: new URL(ROUTE_PATH, BASE_URL),
	pattern: ROUTE_PATH,
} satisfies Omit<Route.ActionArgs, 'request'>
const CHANGE_EMAIL_ARGS_BASE = {
	params: {},
	context: {} as AppLoadContext,
	url: new URL(CHANGE_EMAIL_PATH, BASE_URL),
	pattern: CHANGE_EMAIL_PATH,
} satisfies Omit<ChangeEmailRoute.LoaderArgs, 'request'>

const verifiedTimeKey = 'verified-time'
const unverifiedSessionIdKey = 'unverified-session-id'

test('2FA login rejects a code for a different user than the unverified session', async () => {
	const victim = await createUserWithTwoFA()
	const attacker = await createUserWithTwoFA()
	const victimSession = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: victim.userId,
		},
	})

	const verifySession = await verifySessionStorage.getSession()
	verifySession.set(unverifiedSessionIdKey, victimSession.id)
	const cookie = convertSetCookieToCookie(
		await verifySessionStorage.commitSession(verifySession),
	)

	const { otp } = await generateTOTP(attacker.totpConfig)
	const response = await action({
		...ACTION_ARGS_BASE,
		request: createVerifyRequest({
			cookie,
			code: otp,
			target: attacker.userId,
		}),
	}).catch((e) => e)

	expect(response).toHaveRedirect('/login')
	await expect(response).toSendToast(
		expect.objectContaining({
			type: 'error',
			title: 'Invalid verification',
			description: 'Something went wrong verifying your account.',
		}),
	)
	await expect(response).not.toHaveSessionForUser(victim.userId)
	await expect(response).not.toHaveSessionForUser(attacker.userId)
})

test('2FA login succeeds when the code matches the unverified session user', async () => {
	const user = await createUserWithTwoFA()
	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.userId,
		},
	})

	const verifySession = await verifySessionStorage.getSession()
	verifySession.set(unverifiedSessionIdKey, session.id)
	const cookie = convertSetCookieToCookie(
		await verifySessionStorage.commitSession(verifySession),
	)

	const { otp } = await generateTOTP(user.totpConfig)
	const response = await action({
		...ACTION_ARGS_BASE,
		request: createVerifyRequest({
			cookie,
			code: otp,
			target: user.userId,
			redirectTo: '/settings/profile',
		}),
	})

	expect(response).toHaveRedirect('/settings/profile')
	await expect(response).toHaveSessionForUser(user.userId)
})

test('reverify rejects a 2FA code for a different user than the logged-in session', async () => {
	const victim = await createUserWithTwoFA()
	const attacker = await createUserWithTwoFA()
	const victimSession = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: victim.userId,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, victimSession.id)
	// force a reverify by leaving verified-time unset
	const cookie = convertSetCookieToCookie(
		await authSessionStorage.commitSession(authSession),
	)

	const { otp } = await generateTOTP(attacker.totpConfig)
	const response = await action({
		...ACTION_ARGS_BASE,
		request: createVerifyRequest({
			cookie,
			code: otp,
			target: attacker.userId,
			redirectTo: CHANGE_EMAIL_PATH,
		}),
	}).catch((e) => e)

	expect(response).toHaveRedirect('/login')
	await expect(response).toSendToast(
		expect.objectContaining({
			type: 'error',
			title: 'Invalid verification',
			description: 'Something went wrong verifying your account.',
		}),
	)

	// Victim still needs to reverify — the attack must not refresh verified-time.
	const stillNeedsReverify = await changeEmailLoader({
		...CHANGE_EMAIL_ARGS_BASE,
		request: new Request(new URL(CHANGE_EMAIL_PATH, BASE_URL), {
			headers: { cookie },
		}),
	}).catch((e) => e)
	expect(stillNeedsReverify).toHaveRedirect(
		getReverifyRedirectUrl(victim.userId),
	)
})

test('reverify succeeds when the code matches the logged-in user', async () => {
	const user = await createUserWithTwoFA()
	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.userId,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, session.id)
	const cookie = convertSetCookieToCookie(
		await authSessionStorage.commitSession(authSession),
	)

	const { otp } = await generateTOTP(user.totpConfig)
	const response = await action({
		...ACTION_ARGS_BASE,
		request: createVerifyRequest({
			cookie,
			code: otp,
			target: user.userId,
			redirectTo: CHANGE_EMAIL_PATH,
		}),
	})

	invariant(response instanceof Response, 'response should be a Response')
	expect(response).toHaveRedirect(CHANGE_EMAIL_PATH)

	const setCookies = response.headers.getSetCookie()
	const sessionSetCookie = setCookies.find((c: string) =>
		c.startsWith('en_session='),
	)
	expect(sessionSetCookie).toBeTruthy()
	const updatedCookie = convertSetCookieToCookie(sessionSetCookie!)
	const changeEmailResponse = await changeEmailLoader({
		...CHANGE_EMAIL_ARGS_BASE,
		request: new Request(new URL(CHANGE_EMAIL_PATH, BASE_URL), {
			headers: { cookie: updatedCookie },
		}),
	})
	expect(changeEmailResponse).toEqual({
		user: { email: user.email },
	})
})

test('recent verification within two hours does not require reverify', async () => {
	const user = await createUserWithTwoFA()
	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.userId,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, session.id)
	// three minutes ago — must still be inside the two-hour window
	authSession.set(verifiedTimeKey, Date.now() - 1000 * 60 * 3)
	const cookie = convertSetCookieToCookie(
		await authSessionStorage.commitSession(authSession),
	)

	const response = await changeEmailLoader({
		...CHANGE_EMAIL_ARGS_BASE,
		request: new Request(new URL(CHANGE_EMAIL_PATH, BASE_URL), {
			headers: { cookie },
		}),
	})

	expect(response).toEqual({ user: { email: user.email } })
})

test('verification older than two hours requires reverify', async () => {
	const user = await createUserWithTwoFA()
	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.userId,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, session.id)
	authSession.set(verifiedTimeKey, Date.now() - 1000 * 60 * 60 * 3)
	const cookie = convertSetCookieToCookie(
		await authSessionStorage.commitSession(authSession),
	)

	const response = await changeEmailLoader({
		...CHANGE_EMAIL_ARGS_BASE,
		request: new Request(new URL(CHANGE_EMAIL_PATH, BASE_URL), {
			headers: { cookie },
		}),
	}).catch((e) => e)

	expect(response).toHaveRedirect(getReverifyRedirectUrl(user.userId))
})

function getReverifyRedirectUrl(userId: string) {
	const searchParams = new URLSearchParams({
		type: twoFAVerificationType,
		target: userId,
		redirectTo: CHANGE_EMAIL_PATH,
	})
	return `http://localhost:3000/verify?${searchParams}`
}

async function createUserWithTwoFA() {
	const userData = createUser()
	const { otp: _otp, ...totpConfig } = await generateTOTP()
	const user = await prisma.user.create({
		select: { id: true, email: true },
		data: userData,
	})
	await prisma.verification.create({
		data: {
			type: twoFAVerificationType,
			target: user.id,
			...totpConfig,
		},
	})
	return { userId: user.id, email: user.email, totpConfig }
}

function createVerifyRequest({
	cookie,
	code,
	target,
	redirectTo = '/',
}: {
	cookie: string
	code: string
	target: string
	redirectTo?: string
}) {
	return new Request(new URL(ROUTE_PATH, BASE_URL), {
		method: 'POST',
		headers: { cookie },
		body: new URLSearchParams({
			[codeQueryParam]: code,
			[typeQueryParam]: twoFAVerificationType,
			[targetQueryParam]: target,
			[redirectToQueryParam]: redirectTo,
		}),
	})
}
