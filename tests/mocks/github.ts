import fs from 'node:fs'
import { faker } from '@faker-js/faker'
import { HttpResponse, passthrough, http, type HttpHandler } from 'msw'

const { json } = HttpResponse

export const MOCK_ACCESS_TOKEN = '__MOCK_ACCESS_TOKEN__'
export const primaryGitHubEmail = {
	email: faker.internet.email(),
	verified: true,
	primary: true,
	visibility: 'public',
}
const githubEmails = [
	{
		email: faker.internet.email(),
		verified: false,
		primary: false,
		visibility: 'public',
	},
	{
		email: faker.internet.email(),
		verified: true,
		primary: false,
		visibility: null,
	},
	primaryGitHubEmail,
]
export const mockGithubProfile = {
	login: faker.internet.userName(),
	id: faker.string.uuid(),
	name: faker.person.fullName(),
	avatar_url: 'https://github.com/ghost.png',
	emails: githubEmails.map(e => e.email),
}

const passthroughGitHub =
	!process.env.GITHUB_CLIENT_ID.startsWith('MOCK_') &&
	process.env.NODE_ENV !== 'test'
export const handlers: Array<HttpHandler> = [
	// test this github stuff out without going through github's oauth flow by
	// going to http://localhost:3000/auth/github/callback?code=MOCK_CODE&state=MOCK_STATE
	http.post('https://github.com/login/oauth/access_token', async () => {
		if (passthroughGitHub) return passthrough()

		return new Response(
			new URLSearchParams({
				access_token: MOCK_ACCESS_TOKEN,
				token_type: '__MOCK_TOKEN_TYPE__',
			}).toString(),
			{ headers: { 'content-type': 'application/x-www-form-urlencoded' } },
		)
	}),
	http.get('https://api.github.com/user/emails', async () => {
		if (passthroughGitHub) return passthrough()

		return json(githubEmails)
	}),
	http.get('https://api.github.com/user/:id', async ({ params }) => {
		if (passthroughGitHub) return passthrough()

		if (mockGithubProfile.id === params.id) {
			return json(mockGithubProfile)
		}

		return new Response('Not Found', { status: 404 })
	}),
	http.get('https://api.github.com/user', async () => {
		if (passthroughGitHub) return passthrough()

		return json(mockGithubProfile)
	}),
	http.get('https://github.com/ghost.png', async () => {
		if (passthroughGitHub) return passthrough()

		const buffer = await fs.promises.readFile(
			'./tests/fixtures/images/ghost.jpg',
		)
		return new Response(buffer, {
			// the .png is not a mistake even though it looks like it... It's really a jpg
			// but the ghost image URL really has a png extension 😅
			headers: { 'content-type': 'image/jpg' },
		})
	}),
]
