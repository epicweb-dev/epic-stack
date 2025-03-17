import { http, HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'
import { server } from '#tests/mocks'
import { checkIsCommonPassword, getPasswordHashParts } from './auth.server.ts'

test('checkIsCommonPassword returns true when password is found in breach database', async () => {
	const password = 'testpassword'
	const [prefix, suffix] = getPasswordHashParts(password)

	server.use(
		http.get(`https://api.pwnedpasswords.com/range/${prefix}`, () => {
			// Include the actual suffix in the response with another realistic suffix
			return new HttpResponse(
				`1234567890123456789012345678901234A:1\n${suffix}:1234`,
				{ status: 200 },
			)
		}),
	)

	const result = await checkIsCommonPassword(password)
	expect(result).toBe(true)
})

test('checkIsCommonPassword returns false when password is not found in breach database', async () => {
	const password = 'sup3r-dup3r-s3cret'
	const [prefix] = getPasswordHashParts(password)

	server.use(
		http.get(`https://api.pwnedpasswords.com/range/${prefix}`, () => {
			// Response with realistic suffixes that won't match
			return new HttpResponse(
				'1234567890123456789012345678901234A:1\n' +
					'1234567890123456789012345678901234B:2',
				{ status: 200 },
			)
		}),
	)

	const result = await checkIsCommonPassword(password)
	expect(result).toBe(false)
})

// Error cases
test('checkIsCommonPassword returns false when API returns 500', async () => {
	const password = 'testpassword'
	const [prefix] = getPasswordHashParts(password)

	server.use(
		http.get(`https://api.pwnedpasswords.com/range/${prefix}`, () => {
			return new HttpResponse(null, { status: 500 })
		}),
	)

	const result = await checkIsCommonPassword(password)
	expect(result).toBe(false)
})

test('checkIsCommonPassword times out after 1 second', async () => {
	const consoleWarnSpy = vi.spyOn(console, 'warn')
	server.use(
		http.get('https://api.pwnedpasswords.com/range/:prefix', async () => {
			const twoSecondDelay = 2000
			await new Promise((resolve) => setTimeout(resolve, twoSecondDelay))
			return new HttpResponse(
				'1234567890123456789012345678901234A:1\n' +
					'1234567890123456789012345678901234B:2',
				{ status: 200 },
			)
		}),
	)

	const result = await checkIsCommonPassword('testpassword')
	expect(result).toBe(false)
	expect(consoleWarnSpy).toHaveBeenCalledWith('Password check timed out')
	consoleWarnSpy.mockRestore()
})

test('checkIsCommonPassword returns false when response has invalid format', async () => {
	const consoleWarnSpy = vi.spyOn(console, 'warn')
	const password = 'testpassword'
	const [prefix] = getPasswordHashParts(password)

	server.use(
		http.get(`https://api.pwnedpasswords.com/range/${prefix}`, () => {
			// Create a response that will cause a TypeError when text() is called
			const response = new Response()
			Object.defineProperty(response, 'text', {
				value: () => Promise.resolve(null),
			})
			return response
		}),
	)

	const result = await checkIsCommonPassword(password)
	expect(result).toBe(false)
	expect(consoleWarnSpy).toHaveBeenCalledWith(
		'Unknown error during password check',
		expect.any(TypeError),
	)
	consoleWarnSpy.mockRestore()
})
