import { data } from 'react-router'
import { cache, cachified } from './cache.server.ts'
import { requireUserId } from './auth.server.ts'
import { prisma } from './db.server.ts'
import { type PermissionString, parsePermissionString } from './user.ts'

const permissionCacheKey = (userId: string, permission: PermissionString) =>
	`permission-check:${userId}:${permission}`
const roleCacheKey = (userId: string, name: string) =>
	`role-check:${userId}:${name}`

export async function invalidatePermissionCache(
	userId: string,
	permission: PermissionString,
) {
	await cache.delete(permissionCacheKey(userId, permission))
}

export async function invalidateRoleCache(userId: string, name: string) {
	await cache.delete(roleCacheKey(userId, name))
}

export async function requireUserWithPermission(
	request: Request,
	permission: PermissionString,
) {
	const userId = await requireUserId(request)
	const permissionData = parsePermissionString(permission)
	const allowed = await cachified({
		key: permissionCacheKey(userId, permission),
		cache,
		ttl: 1000 * 60 * 2,
		async getFreshValue() {
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
			return Boolean(user)
		},
	})
	if (!allowed) {
		throw data(
			{
				error: 'Unauthorized',
				requiredPermission: permissionData,
				message: `Unauthorized: required permissions: ${permission}`,
			},
			{ status: 403 },
		)
	}
	return userId
}

export async function requireUserWithRole(request: Request, name: string) {
	const userId = await requireUserId(request)
	const allowed = await cachified({
		key: roleCacheKey(userId, name),
		cache,
		ttl: 1000 * 60 * 2,
		async getFreshValue() {
			const user = await prisma.user.findFirst({
				select: { id: true },
				where: { id: userId, roles: { some: { name } } },
			})
			return Boolean(user)
		},
	})
	if (!allowed) {
		throw data(
			{
				error: 'Unauthorized',
				requiredRole: name,
				message: `Unauthorized: required role: ${name}`,
			},
			{ status: 403 },
		)
	}
	return userId
}
