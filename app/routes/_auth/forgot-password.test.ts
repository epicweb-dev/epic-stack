import { invariant } from '@epic-web/invariant'
import { type AppLoadContext } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import { prisma } from '#app/utils/db.server.ts'
import { createUser } from '#tests/db-utils.ts'
import { requireEmail } from '#tests/mocks/utils.ts'
import { BASE_URL } from '#tests/utils.ts'
import { type Route } from './+types/forgot-password.ts'
import { action } from './forgot-password.tsx'

const ROUTE_PATH = '/forgot-password'
const ACTION_ARGS_BASE = {
	params: {},
	context: {} as AppLoadContext,
	url: new URL(ROUTE_PATH, BASE_URL),
	pattern: ROUTE_PATH,
} satisfies Omit<Route.ActionArgs, 'request'>

afterEach(() => {
	vi.unstubAllEnvs()
})

async function setupUser() {
	return prisma.user.create({
		data: createUser(),
		select: { email: true, username: true },
	})
}

function createForgotPasswordRequest(
	usernameOrEmail: string,
	headers: Record<string, string> = {},
) {
	return new Request(new URL(ROUTE_PATH, BASE_URL), {
		method: 'POST',
		headers,
		body: new URLSearchParams({ usernameOrEmail }),
	})
}

async function getEmailedVerifyUrl(email: string) {
	const sentEmail = await requireEmail(email)
	const link = sentEmail.text.match(
		/https?:\/\/[^\s\]]+\/verify\?[^\s\]]+/,
	)?.[0]
	invariant(link, 'verify link not found in email')
	return new URL(link)
}

test('emailed reset link ignores an untrusted X-Forwarded-Host', async () => {
	vi.stubEnv('ALLOWED_HOSTS', 'www.epicstack.dev')
	const user = await setupUser()
	const response = await action({
		...ACTION_ARGS_BASE,
		request: createForgotPasswordRequest(user.username, {
			host: 'www.epicstack.dev',
			'X-Forwarded-Host': 'attacker.example',
			'X-Forwarded-Proto': 'https',
		}),
	})
	invariant(response instanceof Response, 'response should be a Response')
	expect(response.headers.get('location')).toMatch(
		/^https:\/\/www\.epicstack\.dev\/verify\?/,
	)
	const verifyUrl = await getEmailedVerifyUrl(user.email)
	expect(verifyUrl.origin).toBe('https://www.epicstack.dev')
	expect(verifyUrl.searchParams.get('code')).toBeTruthy()
})

test('emailed reset link falls back to the canonical host for an untrusted Host header', async () => {
	vi.stubEnv('ALLOWED_HOSTS', 'www.epicstack.dev,epicstack.dev')
	const user = await setupUser()
	await action({
		...ACTION_ARGS_BASE,
		request: createForgotPasswordRequest(user.email, {
			host: 'attacker.example',
			'X-Forwarded-Proto': 'https',
		}),
	})
	const verifyUrl = await getEmailedVerifyUrl(user.email)
	expect(verifyUrl.origin).toBe('https://www.epicstack.dev')
})

test('emailed reset link uses the request host when it is allowed', async () => {
	vi.stubEnv('ALLOWED_HOSTS', 'www.epicstack.dev,epicstack.dev')
	const user = await setupUser()
	await action({
		...ACTION_ARGS_BASE,
		request: createForgotPasswordRequest(user.username, {
			host: 'EpicStack.dev',
			'X-Forwarded-Proto': 'https',
		}),
	})
	const verifyUrl = await getEmailedVerifyUrl(user.email)
	expect(verifyUrl.origin).toBe('https://epicstack.dev')
})

test('the Fly.io app hostname is allowed without configuration', async () => {
	vi.stubEnv('ALLOWED_HOSTS', '')
	vi.stubEnv('FLY_APP_NAME', 'epic-stack-test')
	const user = await setupUser()
	await action({
		...ACTION_ARGS_BASE,
		request: createForgotPasswordRequest(user.username, {
			host: 'epic-stack-test.fly.dev',
			'X-Forwarded-Proto': 'https',
		}),
	})
	const verifyUrl = await getEmailedVerifyUrl(user.email)
	expect(verifyUrl.origin).toBe('https://epic-stack-test.fly.dev')
})

test('falls back to the Fly.io app hostname for an untrusted host', async () => {
	vi.stubEnv('ALLOWED_HOSTS', '')
	vi.stubEnv('FLY_APP_NAME', 'epic-stack-test')
	const user = await setupUser()
	await action({
		...ACTION_ARGS_BASE,
		request: createForgotPasswordRequest(user.username, {
			host: 'epic-stack-test.fly.dev',
			'X-Forwarded-Host': 'attacker.example',
			'X-Forwarded-Proto': 'https',
		}),
	})
	const verifyUrl = await getEmailedVerifyUrl(user.email)
	expect(verifyUrl.origin).toBe('https://epic-stack-test.fly.dev')
})
