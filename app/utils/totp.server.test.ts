import { test, expect, vi, afterEach } from 'vitest'
import * as totp from './totp.server.ts'
import { faker } from '@faker-js/faker'

afterEach(() => {
	vi.useRealTimers()
})

test('OTP can be generated and verified', () => {
	const { secret, otp, algorithm, period } = totp.generateTOTP()
	const result = totp.verifyTOTP({ otp, secret })
	expect(result).toEqual({ delta: 0 })
	expect(algorithm).toBe('sha1')
	expect(period).toBe(30)
})

test('Verify TOTP within the specified time window', () => {
	const { otp, secret } = totp.generateTOTP()
	const result = totp.verifyTOTP({ otp, secret, window: 0 })
	expect(result).not.toBeNull()
})

test('Fail to verify an invalid TOTP', () => {
	const secret = faker.string.alphanumeric()
	const tooShortNumber = faker.string.numeric({ length: 5 })
	const result = totp.verifyTOTP({ otp: tooShortNumber, secret })
	expect(result).toBeNull()
})

test('Fail to verify TOTP outside the specified time window', () => {
	vi.useFakeTimers()
	const { otp, secret: key } = totp.generateTOTP()
	const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24)
	vi.setSystemTime(futureDate)
	const result = totp.verifyTOTP({ otp, secret: key })
	expect(result).toBeNull()
})

test('Clock drift is handled by window', () => {
	vi.useFakeTimers()
	const { otp, secret: key } = totp.generateTOTP({ period: 60 })
	const futureDate = new Date(Date.now() + 1000 * 61)
	vi.setSystemTime(futureDate)
	const result = totp.verifyTOTP({ otp, secret: key, window: 1, period: 60 })
	expect(result).toEqual({ delta: -1 })
})

test('Setting a different seconds config for generating and verifying will fail', () => {
	const desiredperiod = 60
	const { otp, secret, period } = totp.generateTOTP({
		period: desiredperiod,
	})
	expect(period).toBe(desiredperiod)
	const result = totp.verifyTOTP({ otp, secret, period: period + 1 })
	expect(result).toBeNull()
})

test('Setting a different algo config for generating and verifying will fail', () => {
	const desiredAlgo = 'sha512'
	const { otp, secret, algorithm } = totp.generateTOTP({
		algorithm: desiredAlgo,
	})
	expect(algorithm).toBe(desiredAlgo)
	const result = totp.verifyTOTP({ otp, secret, algorithm: 'sha1' })
	expect(result).toBeNull()
})

test('OTP Auth URI can be generated', () => {
	const { otp: _otp, secret, ...totpConfig } = totp.generateTOTP()
	const issuer = faker.company.name()
	const accountName = faker.internet.userName()
	const uri = totp.getTOTPAuthUri({
		issuer,
		accountName,
		secret,
		...totpConfig,
	})
	expect(uri).toMatch(/^otpauth:\/\/totp\/(.*)\?/)
})
