import { json } from '@remix-run/node'
import { and, inArray, eq } from 'drizzle-orm'
import {
	Permission,
	PermissionToRole,
	Role,
	RoleToUser,
	User,
} from '#drizzle/schema.ts'
import { requireUserId } from './auth.server.ts'
import { drizzle } from './db.server.ts'
import { type PermissionString, parsePermissionString } from './user.ts'

export async function requireUserWithPermission(
	request: Request,
	permission: PermissionString,
) {
	const userId = await requireUserId(request)
	const permissionData = parsePermissionString(permission)
	const permissionWhere = permissionData.access
		? [inArray(Permission.access, permissionData.access)]
		: []
	const [user] = await drizzle
		.select({ id: User.id })
		.from(User)
		.innerJoin(RoleToUser, eq(User.id, RoleToUser.userId))
		.innerJoin(Role, eq(RoleToUser.roleId, Role.id))
		.innerJoin(PermissionToRole, eq(Role.id, PermissionToRole.roleId))
		.innerJoin(Permission, eq(PermissionToRole.permissionId, Permission.id))
		.where(and(eq(User.id, userId), ...permissionWhere))
	if (!user) {
		throw json(
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
	const [user] = await drizzle
		.select({ id: User.id })
		.from(User)
		.innerJoin(RoleToUser, eq(User.id, RoleToUser.userId))
		.innerJoin(Role, eq(RoleToUser.roleId, Role.id))
		.where(and(eq(User.id, userId), eq(Role.name, name)))
	if (!user) {
		throw json(
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
