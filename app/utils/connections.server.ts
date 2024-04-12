import { createCookieSessionStorage } from '@remix-run/node'

import { type ProviderName } from '#/app/utils/connections.tsx'
import { GitHubProvider } from '#/app/utils/providers/github.server.ts'
import { type AuthProvider } from '#/app/utils/providers/provider.ts'
import { type Timings } from '#/app/utils/timing.server.ts'

export const connectionSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_connection',
		sameSite: 'lax', // CSRF protection is advised if changing to 'none'
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		secrets: process.env.SESSION_SECRET.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
})

export const providers: Record<ProviderName, AuthProvider> = {
	github: new GitHubProvider(),
}

export function handleMockAction(providerName: ProviderName, request: Request) {
	return providers[providerName].handleMockAction(request)
}

export function resolveConnectionData(
	providerName: ProviderName,
	providerId: string,
	options?: { timings?: Timings },
) {
	return providers[providerName].resolveConnectionData(providerId, options)
}
