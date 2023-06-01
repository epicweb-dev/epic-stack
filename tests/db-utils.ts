import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { memoizeUnique } from './memoize-unique.ts'

const unique = memoizeUnique(faker.internet.userName)

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = unique({
		firstName: firstName.toLowerCase(),
		lastName: lastName.toLowerCase(),
	})
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	}
}

export function createPassword(username: string = faker.internet.userName()) {
	return {
		hash: bcrypt.hashSync(username, 10),
	}
}
