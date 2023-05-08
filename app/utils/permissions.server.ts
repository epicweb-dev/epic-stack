import { json } from '@remix-run/node'
import { requireUserId } from './auth.server'
import { prisma } from './db.server'

export async function requireUserWithPermission(
	name: string,
	request: Request,
) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findFirst({
		where: { id: userId, roles: { some: { permissions: { some: { name } } } } },
	})
	if (!user) {
		throw json({ error: 'Unauthorized', requiredRole: name }, { status: 403 })
	}
	return user
}

export async function requireAdmin(request: Request) {
	return requireUserWithPermission('admin', request)
}
