import { SetCookie } from '@mjackson/headers'
import { createId as cuid } from '@paralleldrive/cuid2'
import { redirect } from 'react-router'
import { GitHubStrategy } from 'remix-auth-github'
import { z } from 'zod'
import { cache, cachified } from '../cache.server.ts'
import { type Timings } from '../timing.server.ts'
import { MOCK_CODE_GITHUB_HEADER, MOCK_CODE_GITHUB } from './constants.ts'
import { type AuthProvider } from './provider.ts'

const GitHubUserSchema = z.object({ login: z.string() })
const GitHubUserParseResult = z
	.object({
		success: z.literal(true),
		data: GitHubUserSchema,
	})
	.or(
		z.object({
			success: z.literal(false),
		}),
	)

const shouldMock =
	process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_') ||
	process.env.NODE_ENV === 'test'

type GitHubEmailsResponse = {
	email: string
	verified: boolean
	primary: boolean
	visibility: string | null
}[]

type GitHubUserResponse = {
	login: string
	id: string
	name: string | undefined
	avatar_url: string | undefined
}

export class GitHubProvider implements AuthProvider {
	getAuthStrategy() {
		return new GitHubStrategy(
			{
				clientId: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				redirectURI: '/auth/github/callback',
			},
			async ({ tokens }) => {
				// we need to fetch the user and the emails separately, this is a change in remix-auth-github
				// from the previous version that supported fetching both in one call
				const userResponse = await fetch('https://api.github.com/user', {
					headers: {
						Accept: 'application/vnd.github+json',
						Authorization: `Bearer ${tokens.accessToken()}`,
						'X-GitHub-Api-Version': '2022-11-28',
					},
				})
				const user = (await userResponse.json()) as GitHubUserResponse

				const emailsResponse = await fetch(
					'https://api.github.com/user/emails',
					{
						headers: {
							Accept: 'application/vnd.github+json',
							Authorization: `Bearer ${tokens.accessToken()}`,
							'X-GitHub-Api-Version': '2022-11-28',
						},
					},
				)
				const emails = (await emailsResponse.json()) as GitHubEmailsResponse
				const email = emails.find((e) => e.primary)?.email
				if (!email) {
					throw new Error('Email not found')
				}

				return {
					id: user.id,
					email,
					name: user.name,
					username: user.login,
					imageUrl: user.avatar_url,
				}
			},
		)
	}

	async resolveConnectionData(
		providerId: string,
		{ timings }: { timings?: Timings } = {},
	) {
		const result = await cachified({
			key: `connection-data:github:${providerId}`,
			cache,
			timings,
			ttl: 1000 * 60,
			swr: 1000 * 60 * 60 * 24 * 7,
			async getFreshValue(context) {
				const response = await fetch(
					`https://api.github.com/user/${providerId}`,
					{ headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } },
				)
				const rawJson = await response.json()
				const result = GitHubUserSchema.safeParse(rawJson)
				if (!result.success) {
					// if it was unsuccessful, then we should kick it out of the cache
					// asap and try again.
					context.metadata.ttl = 0
				}
				return result
			},
			checkValue: GitHubUserParseResult,
		})
		return {
			displayName: result.success ? result.data.login : 'Unknown',
			link: result.success ? `https://github.com/${result.data.login}` : null,
		} as const
	}

	async handleMockAction(request: Request) {
		if (!shouldMock) return

		const state = cuid()
		// allows us to inject a code when running e2e tests,
		// but falls back to a pre-defined 🐨 constant
		const code =
			request.headers.get(MOCK_CODE_GITHUB_HEADER) || MOCK_CODE_GITHUB
		const searchParams = new URLSearchParams({ code, state })
		let cookie = new SetCookie({
			name: 'github',
			value: searchParams.toString(),
			path: '/',
			sameSite: 'Lax',
			httpOnly: true,
			maxAge: 60 * 10,
			secure: process.env.NODE_ENV === 'production' || undefined,
		})
		throw redirect(`/auth/github/callback?${searchParams}`, {
			headers: {
				'Set-Cookie': cookie.toString(),
			},
		})
	}
}
