import { faker } from '@faker-js/faker'
import { type AppLoadContext } from 'react-router'
import { expect, test } from 'vitest'
import {
	getSessionExpirationDate,
	verifyUserPassword,
} from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'
import { createPassword, createUser } from '#tests/db-utils.ts'
import { BASE_URL, convertSetCookieToCookie } from '#tests/utils.ts'
import { type Route } from './+types/reset-password.ts'
import { action, resetPasswordUsernameSessionKey } from './reset-password.tsx'

const ROUTE_PATH = '/reset-password'

test('resetting a password signs out all existing sessions', async () => {
	const user = await prisma.user.create({
		data: {
			...createUser(),
			password: { create: createPassword() },
			sessions: {
				create: [
					{ expirationDate: getSessionExpirationDate() },
					{ expirationDate: getSessionExpirationDate() },
				],
			},
		},
		select: { id: true, username: true },
	})

	const verifySession = await verifySessionStorage.getSession()
	verifySession.set(resetPasswordUsernameSessionKey, user.username)
	const cookie = convertSetCookieToCookie(
		await verifySessionStorage.commitSession(verifySession),
	)
	const newPassword = faker.internet.password()
	const request = new Request(new URL(ROUTE_PATH, BASE_URL), {
		method: 'POST',
		headers: { cookie },
		body: new URLSearchParams({
			password: newPassword,
			confirmPassword: newPassword,
		}),
	})

	const response = await action({
		request,
		params: {},
		context: {} as AppLoadContext,
		url: new URL(ROUTE_PATH, BASE_URL),
		pattern: ROUTE_PATH,
	} satisfies Route.ActionArgs)

	expect(response).toHaveRedirect('/login')
	expect(await verifyUserPassword({ id: user.id }, newPassword)).toEqual({
		id: user.id,
	})
	expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0)
})
