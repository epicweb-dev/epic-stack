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

	async handleMockAction(redirectToCookie: string | null) {
		if (!shouldMock) return

		throw redirect(`/auth/github/callback?code=MOCK_CODE&state=MOCK_STATE`, {
			headers: redirectToCookie ? { 'set-cookie': redirectToCookie } : {},
		})
	}

	async handleMockCallback(request: Request) {
		if (!shouldMock) return request

		const cookieSession = await connectionSessionStorage.getSession(
			request.headers.get('cookie'),
		)
		const state = cookieSession.get('oauth2:state') ?? 'MOCK_STATE'
		cookieSession.set('oauth2:state', state)
		const reqUrl = new URL(request.url)
		reqUrl.searchParams.set('state', state)
		request.headers.set(
			'cookie',
			await connectionSessionStorage.commitSession(cookieSession),
		)
		return new Request(reqUrl.toString(), request)
	}
}
