import { faker } from '@faker-js/faker'
import { expect, test } from 'vitest'
import { consoleError } from '#tests/setup/setup-test-env.ts'
import { getErrorMessage } from './misc.tsx'

test('Error object returns message', () => {
	const message = faker.lorem.words(2)
	expect(getErrorMessage(new Error(message))).toBe(message)
})

test('String returns itself', () => {
	const message = faker.lorem.words(2)
	expect(getErrorMessage(message)).toBe(message)
})

test('undefined falls back to Unknown', () => {
	consoleError.mockImplementation(() => {})
	expect(getErrorMessage(undefined)).toBe('Unknown Error')
	expect(consoleError).toHaveBeenCalledWith('Unable to get error message for error', undefined)
	expect(consoleError).toHaveBeenCalledTimes(1)
})
