import { test, expect, vi, afterEach } from 'vitest'
import * as totp from './totp.server.ts'
import { faker } from '@faker-js/faker'

afterEach(() => {
	vi.useRealTimers()
})

test('OTP can be generated and verified', () => {
	const { key, otp, algorithm, validSeconds } = totp.generateTOTP()
	const result = totp.verifyTOTP({ otp, key })
	expect(result).toEqual({ delta: 0 })
	expect(algorithm).toBe('sha256')
	expect(validSeconds).toBe(30)
})

test('Verify TOTP within the specified time window', () => {
	const { otp, key } = totp.generateTOTP()
	const result = totp.verifyTOTP({ otp, key }, { window: 1 })
	expect(result).not.toBeNull()
})

test('Fail to verify an invalid TOTP', () => {
	const key = faker.string.alphanumeric()
	const tooShortNumber = faker.string.numeric({ length: 5 })
	const result = totp.verifyTOTP({ otp: tooShortNumber, key })
	expect(result).toBeNull()
})

test('Fail to verify TOTP outside the specified time window', () => {
	vi.useFakeTimers()
	const { otp, key } = totp.generateTOTP()
	const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24)
	vi.setSystemTime(futureDate)
	const result = totp.verifyTOTP({ otp, key })
	expect(result).toBeNull()
})

test('Clock drift is handled by window', () => {
	vi.useFakeTimers()
	const { otp, key } = totp.generateTOTP({ validSeconds: 60 })
	const futureDate = new Date(Date.now() + 1000 * 61)
	vi.setSystemTime(futureDate)
	const result = totp.verifyTOTP({ otp, key }, { window: 2, validSeconds: 60 })
	expect(result).toEqual({ delta: -1 })
})

test('Setting a different seconds config for generating and verifying will fail', () => {
	const desiredValidSeconds = 60
	const { otp, key, validSeconds } = totp.generateTOTP({
		validSeconds: desiredValidSeconds,
	})
	expect(validSeconds).toBe(desiredValidSeconds)
	const result = totp.verifyTOTP(
		{ otp, key },
		{ validSeconds: validSeconds + 1 },
	)
	expect(result).toBeNull()
})

test('Setting a different algo config for generating and verifying will fail', () => {
	const desiredAlgo = 'sha512'
	const { otp, key, algorithm } = totp.generateTOTP({ algorithm: desiredAlgo })
	expect(algorithm).toBe(desiredAlgo)
	const result = totp.verifyTOTP({ otp, key }, { algorithm: 'sha1' })
	expect(result).toBeNull()
})
