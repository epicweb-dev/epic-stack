/**
 * @vitest-environment node
 */
import { faker } from '@faker-js/faker'
import fs from 'fs'
import { createPassword, createUser } from 'tests/db-utils.ts'
import { BASE_URL, getSessionSetCookieHeader } from 'tests/vitest-utils.ts'
import invariant from 'tiny-invariant'
import { expect, test } from 'vitest'
import { prisma } from '~/utils/db.server.ts'
import { ROUTE_PATH, action } from './delete-image.tsx'

const RESOURCE_URL = `${BASE_URL}${ROUTE_PATH}`

async function setupUser() {
	const userData = createUser()
	const session = await prisma.session.create({
		data: {
			expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			user: {
				create: {
					...userData,
					password: {
						create: createPassword(userData.username),
					},
					image: {
						create: {
							contentType: 'image/jpeg',
							file: {
								create: {
									blob: await fs.promises.readFile(
										'./tests/fixtures/test-profile.jpg',
									),
								},
							},
						},
					},
				},
			},
		},
		select: {
			id: true,
			user: {
				select: { id: true, imageId: true },
			},
		},
	})
	const { user } = session
	invariant(user.imageId, 'User should have an image')
	return {
		user: { ...user, imageId: user.imageId },
		cookie: await getSessionSetCookieHeader(session),
	}
}

test('allows users to delete their own images', async () => {
	const { user, cookie } = await setupUser()
	const form = new FormData()
	form.set('intent', 'submit')
	form.set('imageId', user.imageId)
	const request = new Request(RESOURCE_URL, {
		method: 'POST',
		headers: { cookie },
		body: form,
	})

	const response = await action({ request, params: {}, context: {} })
	expect(await response.json()).toEqual({ status: 'success' })
	const deletedImage = await prisma.image.findUnique({
		where: { fileId: user.imageId },
	})

	expect(deletedImage, 'Image should be deleted').toBeNull()
})

test('requires auth', async () => {
	const form = new FormData()
	form.set('intent', 'submit')
	form.set('imageId', faker.string.uuid())
	const request = new Request(RESOURCE_URL, {
		method: 'POST',
		body: form,
	})
	const response = await action({ request, params: {}, context: {} }).catch(
		r => r,
	)
	if (!(response instanceof Response)) {
		throw new Error('Expected response to be a Response')
	}
	expect(response.headers.get('Location')).toEqual('/login')
})

test('validates the form', async () => {
	const { user, cookie } = await setupUser()
	const form = new FormData()
	form.set('intent', 'submit')
	form.set('somethingElse', user.imageId)
	const request = new Request(RESOURCE_URL, {
		method: 'POST',
		headers: { cookie },
		body: form,
	})
	const response = await action({ request, params: {}, context: {} })
	expect(await response.json()).toEqual({
		status: 'error',
		submission: {
			error: {
				imageId: 'Required',
			},
			intent: 'submit',
			payload: {
				intent: 'submit',
				somethingElse: user.imageId,
			},
		},
	})
	expect(response.status).toBe(400)
})

test('cannot delete an image that does not exist', async () => {
	const { cookie } = await setupUser()
	const form = new FormData()
	form.set('intent', 'submit')
	const fakeImageId = faker.string.uuid()
	form.set('imageId', fakeImageId)
	const request = new Request(RESOURCE_URL, {
		method: 'POST',
		headers: { cookie },
		body: form,
	})
	const response = await action({ request, params: {}, context: {} })
	expect(await response.json()).toEqual({
		status: 'error',
		submission: {
			error: {
				imageId: ['Image not found'],
			},
			intent: 'submit',
			payload: {
				intent: 'submit',
				imageId: fakeImageId,
			},
			value: {
				imageId: fakeImageId,
			},
		},
	})
	expect(response.status).toBe(404)
})
