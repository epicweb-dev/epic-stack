/**
 * @vitest-environment node
 */
import { test, expect } from 'vitest'
import { faker } from '@faker-js/faker'
import { encrypt, decrypt } from './encryption.server.ts'

let originalEncryptionSecret: string

beforeEach(() => {
	originalEncryptionSecret = process.env.ENCRYPTION_SECRET
	process.env.ENCRYPTION_SECRET = 'testing-encryption-secret'
})

afterEach(() => {
	process.env.ENCRYPTION_SECRET = originalEncryptionSecret
})

test('encrypts and decrypts text correctly', () => {
	const originalText = 'Hello, World!'
	const encryptedText = encrypt(originalText)
	const decryptedText = decrypt(encryptedText)

	expect(decryptedText).toBe(originalText)
})

test('throws an error when trying to decrypt invalid text', () => {
	const invalidText = faker.lorem.words(3)

	expect(() => decrypt(invalidText)).toThrowError('Invalid text.')
})

test('produces different encrypted text for the same input', () => {
	const originalText = 'Hello, World!'
	const encryptedText1 = encrypt(originalText)
	const encryptedText2 = encrypt(originalText)

	expect(encryptedText1).not.toBe(encryptedText2)
})
