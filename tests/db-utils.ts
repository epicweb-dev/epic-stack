import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { UniqueEnforcer } from 'enforce-unique'

const uniqueUsernameEnforcer = new UniqueEnforcer()

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = uniqueUsernameEnforcer
		.enforce(() => {
			return (
				faker.string.alphanumeric({ length: 2 }) +
				'_' +
				faker.internet.username({
					firstName: firstName.toLowerCase(),
					lastName: lastName.toLowerCase(),
				})
			)
		})
		.slice(0, 20)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	}
}

export function createPassword(password: string = faker.internet.password()) {
	return {
		hash: bcrypt.hashSync(password, 10),
	}
}

let noteImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getNoteImages() {
	if (noteImages) return noteImages

	noteImages = await Promise.all([
		img({
			altText: 'a nice country house',
			objectKey: 'notes/0.png',
		}),
		img({
			altText: 'a city scape',
			objectKey: 'notes/1.png',
		}),
		img({
			altText: 'a sunrise',
			objectKey: 'notes/2.png',
		}),
		img({
			altText: 'a group of friends',
			objectKey: 'notes/3.png',
		}),
		img({
			altText: 'friends being inclusive of someone who looks lonely',
			objectKey: 'notes/4.png',
		}),
		img({
			altText: 'an illustration of a hot air balloon',
			objectKey: 'notes/5.png',
		}),
		img({
			altText:
				'an office full of laptops and other office equipment that look like it was abandoned in a rush out of the building in an emergency years ago.',
			objectKey: 'notes/6.png',
		}),
		img({
			altText: 'a rusty lock',
			objectKey: 'notes/7.png',
		}),
		img({
			altText: 'something very happy in nature',
			objectKey: 'notes/8.png',
		}),
		img({
			altText: `someone at the end of a cry session who's starting to feel a little better.`,
			objectKey: 'notes/9.png',
		}),
	])

	return noteImages
}

let userImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getUserImages() {
	if (userImages) return userImages

	userImages = await Promise.all(
		Array.from({ length: 10 }, (_, index) =>
			img({ objectKey: `user/${index}.jpg` }),
		),
	)

	return userImages
}

export async function img({
	altText,
	objectKey,
}: {
	altText?: string
	objectKey: string
}) {
	return {
		altText,
		objectKey,
		contentType: objectKey.endsWith('.png') ? 'image/png' : 'image/jpeg',
	}
}
