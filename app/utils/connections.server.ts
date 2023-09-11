import { createCookieSessionStorage } from '@remix-run/node'
import { type ProviderName } from './connections.tsx'
import { GitHubProvider } from './providers/github.server.ts'
import { type AuthProvider } from './providers/provider.ts'

export const connectionSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_connection',
		sameSite: 'lax',
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

export function handleMockAction(
	providerName: ProviderName,
	redirectToCookie: string | null,
) {
	return providers[providerName].handleMockAction(redirectToCookie)
}

export function handleMockCallback(
	providerName: ProviderName,
	request: Request,
) {
	return providers[providerName].handleMockCallback(request)
}

export function resolveConnectionData(
	providerName: ProviderName,
	providerId: string,
) {
	return providers[providerName].resolveConnectionData(providerId)
}
