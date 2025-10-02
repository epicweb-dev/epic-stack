import { redirect, type MiddlewareFunction } from 'react-router'
import { userIdContext } from '#app/context.ts'
import { prisma } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'

export const requireUserMiddleware: MiddlewareFunction = async ({
	request,
	context,
}) => {
	const cookie = request.headers.get('cookie')
	const session = await authSessionStorage.getSession(cookie)
	const sessionId = session.get('sessionId') as string | undefined
	if (!sessionId)
		throw redirect(
			`/login?redirectTo=${encodeURIComponent(new URL(request.url).pathname)}`,
		)

	const sessionRecord = await prisma.session.findUnique({
		select: { userId: true, expirationDate: true },
		where: { id: sessionId },
	})

	if (!sessionRecord || sessionRecord.expirationDate < new Date()) {
		throw redirect(
			`/login?redirectTo=${encodeURIComponent(new URL(request.url).pathname)}`,
		)
	}

	context.set(userIdContext, sessionRecord.userId)
}

export const requireAnonymousMiddleware: MiddlewareFunction = async ({
	request,
}) => {
	const cookie = request.headers.get('cookie')
	const session = await authSessionStorage.getSession(cookie)
	const sessionId = session.get('sessionId') as string | undefined
	if (sessionId) throw redirect('/')
}
