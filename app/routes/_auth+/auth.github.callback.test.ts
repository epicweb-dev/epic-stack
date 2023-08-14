import { generateTOTP } from '@epic-web/totp'
import { faker } from '@faker-js/faker'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { createUser } from '../../../tests/db-utils.ts'
import {
	mockGithubProfile,
	primaryGitHubEmail,
} from '../../../tests/mocks/github.ts'
import { server } from '../../../tests/mocks/index.ts'
import { consoleError } from '../../../tests/setup/setup-test-env.ts'
import { BASE_URL, convertSetCookieToCookie } from '../../../tests/utils.ts'
import {
	getSessionExpirationDate,
	sessionKey,
} from '../../utils/auth.server.ts'
import { prisma } from '../../utils/db.server.ts'
import { GITHUB_PROVIDER_NAME } from '../../utils/github-auth.server.ts'
import { invariant } from '../../utils/misc.tsx'
import { sessionStorage } from '../../utils/session.server.ts'
import { twoFAVerificationType } from '../settings+/profile.two-factor.tsx'
import { ROUTE_PATH, loader } from './auth.github.callback.ts'

test('a new user goes to onboarding', async () => {
	const request = await setupRequest()
	const response = await loader({ request, params: {}, context: {} }).catch(
		e => e,
	)
	expect(response).toHaveRedirect('/onboarding/github')
})

test('when auth fails, send the user to login with a toast', async () => {
	server.use(
		http.post('https://github.com/login/oauth/access_token', async () => {
			return new Response('error', { status: 400 })
		}),
	)
	const request = await setupRequest()
	const response = await loader({ request, params: {}, context: {} }).catch(
		e => e,
	)
	invariant(response instanceof Response, 'response should be a Response')
	expect(response).toHaveRedirect('/login')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Auth Failed',
			type: 'error',
		}),
	)
	expect(consoleError).toHaveBeenCalledTimes(1)
	consoleError.mockClear()
})

test('when a user is logged in, it creates the connection', async () => {
	const session = await setupUser()
	const request = await setupRequest(session.id)
	const response = await loader({ request, params: {}, context: {} })
	expect(response).toHaveRedirect('/settings/profile/connections')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Connected',
			type: 'success',
			description: expect.stringContaining(mockGithubProfile.login),
		}),
	)
	const connection = await prisma.connection.findFirst({
		select: { id: true },
		where: {
			userId: session.userId,
			providerId: mockGithubProfile.id.toString(),
		},
	})
	expect(
		connection,
		'the connection was not created in the database',
	).toBeTruthy()
})

test(`when a user is logged in and has already connected, it doesn't do anything and just redirects the user back to the connections page`, async () => {
	const session = await setupUser()
	await prisma.connection.create({
		data: {
			providerName: GITHUB_PROVIDER_NAME,
			userId: session.userId,
			providerId: mockGithubProfile.id.toString(),
		},
	})
	const request = await setupRequest(session.id)
	const response = await loader({ request, params: {}, context: {} })
	expect(response).toHaveRedirect('/settings/profile/connections')
	expect(response).toSendToast(
		expect.objectContaining({
			title: 'Already Connected',
			description: expect.stringContaining(mockGithubProfile.login),
		}),
	)
})

test('when a user exists with the same email, create connection and make session', async () => {
	const email = primaryGitHubEmail.email.toLowerCase()
	const { userId } = await setupUser({ ...createUser(), email })
	const request = await setupRequest()
	const response = await loader({ request, params: {}, context: {} })

	expect(response).toHaveRedirect('/')

	await expect(response).toSendToast(
		expect.objectContaining({
			type: 'message',
			description: expect.stringContaining(mockGithubProfile.login),
		}),
	)

	const connection = await prisma.connection.findFirst({
		select: { id: true },
		where: {
			userId: userId,
			providerId: mockGithubProfile.id.toString(),
		},
	})
	expect(
		connection,
		'the connection was not created in the database',
	).toBeTruthy()

	await expect(response).toHaveSessionForUser(userId)
})

test('gives an error if the account is already connected to another user', async () => {
	await prisma.user.create({
		data: {
			...createUser(),
			connections: {
				create: {
					providerName: GITHUB_PROVIDER_NAME,
					providerId: mockGithubProfile.id.toString(),
				},
			},
		},
	})
	const session = await setupUser()
	const request = await setupRequest(session.id)
	const response = await loader({ request, params: {}, context: {} })
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
	const { userId } = await setupUser()
	await prisma.connection.create({
		data: {
			providerName: GITHUB_PROVIDER_NAME,
			providerId: mockGithubProfile.id.toString(),
			userId,
		},
	})
	const request = await setupRequest()
	const response = await loader({ request, params: {}, context: {} })
	expect(response).toHaveRedirect('/')
	await expect(response).toHaveSessionForUser(userId)
})

test('if a user is not logged in, but the connection exists and they have enabled 2FA, send them to verify their 2FA and do not make a session', async () => {
	const { userId } = await setupUser()
	await prisma.connection.create({
		data: {
			providerName: GITHUB_PROVIDER_NAME,
			providerId: mockGithubProfile.id.toString(),
			userId,
		},
	})
	const { otp: _otp, ...config } = generateTOTP()
	await prisma.verification.create({
		data: {
			type: twoFAVerificationType,
			target: userId,
			...config,
		},
	})
	const request = await setupRequest()
	const response = await loader({ request, params: {}, context: {} })
	const searchParams = new URLSearchParams({
		type: twoFAVerificationType,
		target: userId,
		redirectTo: '/',
		remember: 'on',
	})
	searchParams.sort()
	expect(response).toHaveRedirect(`/verify?${searchParams}`)
})

async function setupRequest(sessionId?: string) {
	const url = new URL(ROUTE_PATH, BASE_URL)
	const state = faker.string.uuid()
	const code = faker.string.uuid()
	url.searchParams.set('state', state)
	url.searchParams.set('code', code)
	const cookieSession = await sessionStorage.getSession()
	cookieSession.set('oauth2:state', state)
	if (sessionId) cookieSession.set(sessionKey, sessionId)
	const setCookieHeader = await sessionStorage.commitSession(cookieSession)
	const request = new Request(url.toString(), {
		method: 'GET',
		headers: { cookie: convertSetCookieToCookie(setCookieHeader) },
	})
	return request
}

async function setupUser(userData = createUser()) {
	const session = await prisma.session.create({
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

	return session
}
