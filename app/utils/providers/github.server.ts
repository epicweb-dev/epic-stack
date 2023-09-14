import { createId as cuid } from '@paralleldrive/cuid2'
import { redirect } from '@remix-run/node'
import { GitHubStrategy } from 'remix-auth-github'
import { z } from 'zod'
import { connectionSessionStorage } from '../connections.server.ts'
import { type AuthProvider } from './provider.ts'

const GitHubUserSchema = z.object({ login: z.string() })

const shouldMock = process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_')

export class GitHubProvider implements AuthProvider {
	getAuthStrategy() {
		return new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				callbackURL: '/auth/github/callback',
			},
			async ({ profile }) => {
				const email = profile.emails[0].value.trim().toLowerCase()
				const username = profile.displayName
				const imageUrl = profile.photos[0].value
				return {
					email,
					id: profile.id,
					username,
					name: profile.name.givenName,
					imageUrl,
				}
			},
		)
	}

	async resolveConnectionData(providerId: string) {
		const response = await fetch(`https://api.github.com/user/${providerId}`, {
			headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
		})
		const rawJson = await response.json()
		const result = GitHubUserSchema.safeParse(rawJson)
		return {
			displayName: result.success ? result.data.login : 'Unknown',
			link: result.success ? `https://github.com/${result.data.login}` : null,
		} as const
	}

	async handleMockAction(request: Request) {
		if (!shouldMock) return

		const connectionSession = await connectionSessionStorage.getSession(
			request.headers.get('cookie'),
		)
		const state = cuid()
		connectionSession.set('oauth2:state', state)
		const code = 'MOCK_CODE_GITHUB_KODY'
		const searchParams = new URLSearchParams({ code, state })
		throw redirect(`/auth/github/callback?${searchParams}`, {
			headers: {
				'set-cookie':
					await connectionSessionStorage.commitSession(connectionSession),
			},
		})
	}
}
