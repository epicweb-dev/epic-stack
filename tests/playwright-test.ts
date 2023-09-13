import { test as base } from '@playwright/test'
import { type User, insertNewUser, deleteUsers } from '#tests/db-utils.ts'

export { expect } from '@playwright/test'

export const test = base.extend<{
	insertNewUser: (user?: {
		username?: string
		password?: string
		email?: string
	}) => Promise<{ id: string; username: string; name: string; email: string }>
}>({
	insertNewUser: async ({}, use) => {
		const insertedUsers: User[] = []
		await use(async ({ username, email, password } = {}) => {
			const user = await insertNewUser({ username, email, password });
			insertedUsers.push(user)
			return user
		})
		await deleteUsers(insertedUsers)
	},
})
