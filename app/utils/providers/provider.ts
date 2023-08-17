import { type Strategy } from 'remix-auth'

// Define a user type for cleaner typing
export type ProviderUser = {
	id: string
	email: string
	username?: string
	name?: string
	imageUrl?: string
}

export interface AuthProvider {
	getAuthStrategy(): Strategy<ProviderUser, any>
	handleMockAction(redirectToCookie: string | null): Promise<void>
	handleMockCallback(request: Request): Promise<Request>
	resolveConnectionData(providerId: string): Promise<{
		displayName: string
		link?: string | null
	}>
}
