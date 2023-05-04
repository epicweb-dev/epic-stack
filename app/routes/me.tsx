import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { authenticator, requireUserId } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({ where: { id: userId } })
	if (!user) {
		const requestUrl = new URL(request.url)
		const loginParams = new URLSearchParams([
			['redirectTo', `${requestUrl.pathname}${requestUrl.search}`],
		])
		const redirectTo = `/login?${loginParams}`
		await authenticator.logout(request, { redirectTo })
		return redirect(redirectTo)
	}
	return redirect(`/users/${user.username}`)
}
