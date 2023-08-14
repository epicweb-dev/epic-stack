import { GitHubStrategy } from 'remix-auth-github'

export const GITHUB_PROVIDER_NAME = 'github'

export function getGitHubAuthStrategy() {
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
