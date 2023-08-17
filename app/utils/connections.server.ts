import { type ProviderName } from './connections.tsx'
import { GitHubProvider } from './providers/github.server.ts'
import { type AuthProvider } from './providers/provider.ts'

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
