import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { UniqueEnforcer } from 'enforce-unique'

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const uniqueUsernameEnforcer = new UniqueEnforcer()
	const username = uniqueUsernameEnforcer.enforce(() => {
		return faker.internet.userName({
			firstName: firstName.toLowerCase(),
			lastName: lastName.toLowerCase(),
		})
	})
		.slice(0, 20)
		.replace(/[^a-z0-9_]/g, '_')
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
