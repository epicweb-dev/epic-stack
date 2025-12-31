import { invariant } from '@epic-web/invariant'
import { faker } from '@faker-js/faker'
import { SetCookie } from '@mjackson/headers'
import { http } from 'msw'
import { type AppLoadContext } from 'react-router'
import { afterEach, expect, test } from 'vitest'
import { twoFAVerificationType } from '#app/routes/settings/profile/two-factor/_layout.tsx'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { APP_BASE_URL } from '#app/utils/branding.ts'
import { GITHUB_PROVIDER_NAME } from '#app/utils/connections.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { generateTOTP } from '#app/utils/totp.server.ts'
import { createUser } from '#tests/db-utils.ts'
import { deleteGitHubUsers, insertGitHubUser } from '#tests/mocks/github.ts'
import { server } from '#tests/mocks/index.ts'
import { consoleError } from '#tests/setup/setup-test-env.ts'
import { convertSetCookieToCookie } from '#tests/utils.ts'
import { loader } from './callback.ts'

const ROUTE_PATH = '/auth/github/callback'
const PARAMS = { provider: 'github' }
const ROUTE_PATTERN = '/auth/:provider/callback'

function buildLoaderArgs(request: Request) {
	return {
		request,
		params: PARAMS,
		context: {} as AppLoadContext,
		unstable_pattern: ROUTE_PATTERN,
	}
}

afterEach(async () => {
	await deleteGitHubUsers()
})

test('a new user goes to onboarding', async () => {
	const request = await setupRequest()
	const response = await loader(buildLoaderArgs(request)).catch((e) => e)
	expect(response).toHaveRedirect('/onboarding/github')
})

test('when auth fails, send the user to login with a toast', async () => {
	consoleError.mockImplementation(() => {})
	server.use(
		http.post('https://github.com/login/oauth/access_token', async () => {
			return new Response(null, { status: 400 })
		}),
	)
	const request = await setupRequest()
	const response = await loader(buildLoaderArgs(request)).catch((e) => e)
	invariant(response instanceof Response, 'response should be a Response')
	expect(response).toHaveRedirect('/login')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Auth Failed',
			type: 'error',
		}),
	)
	expect(consoleError).toHaveBeenCalledTimes(1)
})

test('when a user is logged in, it creates the connection', async () => {
	const githubUser = await insertGitHubUser()
	const session = await setupUser()
	const request = await setupRequest({
		sessionId: session.id,
		code: githubUser.code,
	})
	const response = await loader(buildLoaderArgs(request))
	expect(response).toHaveRedirect('/settings/profile/connections')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Connected',
			type: 'success',
			description: expect.stringContaining(githubUser.profile.login),
		}),
	)
	const connection = await prisma.connection.findFirst({
		select: { id: true },
		where: {
			userId: session.userId,
			providerId: githubUser.profile.id.toString(),
		},
	})
	expect(
		connection,
		'the connection was not created in the database',
	).toBeTruthy()
})

test(`when a user is logged in and has already connected, it doesn't do anything and just redirects the user back to the connections page`, async () => {
	const session = await setupUser()
	const githubUser = await insertGitHubUser()
	await prisma.connection.create({
		data: {
			providerName: GITHUB_PROVIDER_NAME,
			userId: session.userId,
			providerId: githubUser.profile.id.toString(),
		},
	})
	const request = await setupRequest({
		sessionId: session.id,
		code: githubUser.code,
	})
	const response = await loader(buildLoaderArgs(request))
	expect(response).toHaveRedirect('/settings/profile/connections')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Already Connected',
			description: expect.stringContaining(githubUser.profile.login),
		}),
	)
})

test('when a user exists with the same email, create connection and make session', async () => {
	const githubUser = await insertGitHubUser()
	const email = githubUser.primaryEmail.toLowerCase()
	const { userId } = await setupUser({ ...createUser(), email })
	const request = await setupRequest({ code: githubUser.code })
	const response = await loader(buildLoaderArgs(request))

	expect(response).toHaveRedirect('/')

	await expect(response).toSendToast(
		expect.objectContaining({
			type: 'message',
			description: expect.stringContaining(githubUser.profile.login),
		}),
	)

	const connection = await prisma.connection.findFirst({
		select: { id: true },
		where: {
			userId: userId,
			providerId: githubUser.profile.id.toString(),
		},
	})
	expect(
		connection,
		'the connection was not created in the database',
	).toBeTruthy()

	await expect(response).toHaveSessionForUser(userId)
})

test('gives an error if the account is already connected to another user', async () => {
	const githubUser = await insertGitHubUser()
	await prisma.user.create({
		data: {
			...createUser(),
			connections: {
				create: {
					providerName: GITHUB_PROVIDER_NAME,
					providerId: githubUser.profile.id.toString(),
				},
			},
		},
	})
	const session = await setupUser()
	const request = await setupRequest({
		sessionId: session.id,
		code: githubUser.code,
	})
	const response = await loader(buildLoaderArgs(request))
	expect(response).toHaveRedirect('/settings/profile/connections')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Already Connected',
			description: expect.stringContaining(
				'already connected to another account',
			),
		}),
	)
})

test('if a user is not logged in, but the connection exists, make a session', async () => {
	const githubUser = await insertGitHubUser()
	const { userId } = await setupUser()
	await prisma.connection.create({
		data: {
			providerName: GITHUB_PROVIDER_NAME,
			providerId: githubUser.profile.id.toString(),
			userId,
		},
	})
	const request = await setupRequest({ code: githubUser.code })
	const response = await loader(buildLoaderArgs(request))
	expect(response).toHaveRedirect('/')
	await expect(response).toHaveSessionForUser(userId)
})

test('if a user is not logged in, but the connection exists and they have enabled 2FA, send them to verify their 2FA and do not make a session', async () => {
	const githubUser = await insertGitHubUser()
	const { userId } = await setupUser()
	await prisma.connection.create({
		data: {
			providerName: GITHUB_PROVIDER_NAME,
			providerId: githubUser.profile.id.toString(),
			userId,
		},
	})
	const { otp: _otp, ...config } = await generateTOTP()
	await prisma.verification.create({
		data: {
			type: twoFAVerificationType,
			target: userId,
			...config,
		},
	})
	const request = await setupRequest({ code: githubUser.code })
	const response = await loader(buildLoaderArgs(request))
	const searchParams = new URLSearchParams({
		type: twoFAVerificationType,
		target: userId,
		redirectTo: '/',
	})
	expect(response).toHaveRedirect(`/verify?${searchParams}`)
})

async function setupRequest({
	sessionId,
	code = faker.string.uuid(),
}: { sessionId?: string; code?: string } = {}) {
	const url = new URL(ROUTE_PATH, APP_BASE_URL)
	const state = faker.string.uuid()
	url.searchParams.set('state', state)
	url.searchParams.set('code', code)
	const authSession = await authSessionStorage.getSession()
	if (sessionId) authSession.set(sessionKey, sessionId)
	const setSessionCookieHeader =
		await authSessionStorage.commitSession(authSession)
	const searchParams = new URLSearchParams({ code, state })
	let authCookie = new SetCookie({
		name: 'github',
		value: searchParams.toString(),
		path: '/',
		sameSite: 'Lax',
		httpOnly: true,
		maxAge: 60 * 10,
		secure: process.env.NODE_ENV === 'production' || undefined,
	})

	return new Request(url.toString(), {
		method: 'GET',
		headers: {
			cookie: [
				authCookie.toString(),
				convertSetCookieToCookie(setSessionCookieHeader),
			].join('; '),
		},
	})
}

async function setupUser(userData = createUser()) {
	return prisma.session.create({
		data: {
			expirationDate: getSessionExpirationDate(),
			user: {
				create: {
					...userData,
				},
			},
		},
		select: {
			id: true,
			userId: true,
		},
	})
}
