import { faker } from '@faker-js/faker'

export interface TestNote {
	title: string
	content: string
}

export function createNote(): TestNote {
	return {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	}
}
