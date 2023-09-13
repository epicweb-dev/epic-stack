import { test as base } from '@playwright/test'
import { getPasswordHash } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { createUser } from '#tests/db-utils.ts'

export { expect } from '@playwright/test'

export const test = base.extend<{
	insertUser: (user?: {
		username?: string
		password?: string
		email?: string
	}) => Promise<{ id: string; username: string; name: string; email: string }>
}>({
	insertUser: async ({}, use) => {
		const insertedUsers = new Set<string>()
		await use(async ({ username, email, password } = {}) => {
			const userData = createUser()
			username ??= userData.username
			password ??= userData.username
			email ??= userData.email
			const user = await prisma.user.create({
				select: { id: true, name: true, username: true, email: true },
				data: {
					...userData,
					email,
					username,
					roles: { connect: { name: 'user' } },
					password: { create: { hash: await getPasswordHash(password) } },
				},
			})
			insertedUsers.add(user.id)
			return user as typeof user & { name: string }
		})
		await prisma.user.deleteMany({
			where: { id: { in: Array.from(insertedUsers) } },
		})
	},
})
