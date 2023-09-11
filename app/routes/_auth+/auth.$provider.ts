import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
import { handleMockAction } from '#app/utils/connections.server.ts'
import { ProviderNameSchema } from '#app/utils/connections.tsx'
import { getReferrerRoute } from '#app/utils/misc.tsx'
import { getRedirectCookieHeader } from '#app/utils/redirect-cookie.server.ts'

export async function loader() {
	return redirect('/login')
}

export async function action({ request, params }: DataFunctionArgs) {
	const providerName = ProviderNameSchema.parse(params.provider)
	const formData = await request.formData()
	const rawRedirectTo = formData.get('redirectTo')
	const redirectTo =
		typeof rawRedirectTo === 'string'
			? rawRedirectTo
			: getReferrerRoute(request)

	const redirectToCookie = getRedirectCookieHeader(redirectTo)

	await handleMockAction(providerName, { request, redirectTo })
	try {
		return await authenticator.authenticate(providerName, request)
	} catch (error: unknown) {
		if (error instanceof Response && redirectToCookie) {
			error.headers.append('set-cookie', redirectToCookie)
		}
		throw error
	}
}
