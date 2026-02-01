import { remember } from '@epic-web/remember'
import { LRUCache } from 'lru-cache'
import { data } from 'react-router'
import { requireUserId } from './auth.server.ts'
import { prisma } from './db.server.ts'
import { type PermissionString, parsePermissionString } from './user.ts'

const permissionCheckCache = remember(
	'permission-check-cache',
	() => new LRUCache<string, boolean>({ max: 10000, ttl: 1000 * 60 * 2 }),
)

const roleCheckCache = remember(
	'role-check-cache',
	() => new LRUCache<string, boolean>({ max: 10000, ttl: 1000 * 60 * 2 }),
)

export async function requireUserWithPermission(
	request: Request,
	permission: PermissionString,
) {
	const userId = await requireUserId(request)
	const permissionData = parsePermissionString(permission)
	const cacheKey = `${userId}:${permission}`
	const cached = permissionCheckCache.get(cacheKey)
	if (cached === true) return userId
	if (cached === false) {
		throw data(
			{
				error: 'Unauthorized',
				requiredPermission: permissionData,
				message: `Unauthorized: required permissions: ${permission}`,
			},
			{ status: 403 },
		)
	}
	const user = await prisma.user.findFirst({
		select: { id: true },
		where: {
			id: userId,
			roles: {
				some: {
					permissions: {
						some: {
							...permissionData,
							access: permissionData.access
								? { in: permissionData.access }
								: undefined,
						},
					},
				},
			},
		},
	})
	permissionCheckCache.set(cacheKey, Boolean(user))
	if (!user) {
		throw data(
			{
				error: 'Unauthorized',
				requiredPermission: permissionData,
				message: `Unauthorized: required permissions: ${permission}`,
			},
			{ status: 403 },
		)
	}
	return user.id
}

export async function requireUserWithRole(request: Request, name: string) {
	const userId = await requireUserId(request)
	const cacheKey = `${userId}:${name}`
	const cached = roleCheckCache.get(cacheKey)
	if (cached === true) return userId
	if (cached === false) {
		throw data(
			{
				error: 'Unauthorized',
				requiredRole: name,
				message: `Unauthorized: required role: ${name}`,
			},
			{ status: 403 },
		)
	}
	const user = await prisma.user.findFirst({
		select: { id: true },
		where: { id: userId, roles: { some: { name } } },
	})
	roleCheckCache.set(cacheKey, Boolean(user))
	if (!user) {
		throw data(
			{
				error: 'Unauthorized',
				requiredRole: name,
				message: `Unauthorized: required role: ${name}`,
			},
			{ status: 403 },
		)
	}
	return user.id
}
