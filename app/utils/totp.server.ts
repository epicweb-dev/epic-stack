/**
 * This was copy/paste/modified from https://npm.im/notp (MIT)
 *
 * The primary motivation was to support a more secure algorithm than sha1.
 * The maintainer has not actively responded to issues or pull requests in years.
 *
 * Some improvements were made to modernize the code (which was last published in 2014).
 *
 * Terms:
 *   OTP: One Time Password
 *   HOTP: HMAC-based One Time Password
 *   TOTP: Time-based One Time Password
 *
 * The TOTP is what we typically use for verification codes. This can be used
 * for 2FA (two-factor authentication), but also used for email verification,
 * password reset, etc.
 *
 * Here's the typical process:
 * 1. Generate a secret key (crypto.randomBytes(32).toString('hex'))
 * 2. Generate the TOTP with that key (generateTOTP(key))
 * 3. Store the key and the TOTP in the database along with the thing you're verifying (e.g. user email)
 * 4. Send the TOTP to the user (e.g. email it to them)
 * 5. When the user enters the TOTP, verify it (verifyTOTP(token, key))
 * 6. If the TOTP is valid, delete it from the database and allow the user to proceed
 *
 * Anyone can feel free to turn this into an open source package that we can use
 * in the Epic Stack.
 */
import * as crypto from 'crypto'

const DEFAULT_ALGORITHM = 'sha256'
const DEFAULT_DIGITS = 6
const DEFAULT_WINDOW = 3
const DEFAULT_VALID_SECONDS = 30

function intToBytes(num: number) {
	const buffer = Buffer.alloc(8)
	buffer.writeBigInt64BE(BigInt(num))
	return [...buffer]
}

function hexToBytes(hex: string) {
	return [...Buffer.from(hex, 'hex')]
}

function generateHOTP(
	key = '',
	{ counter = 0, digits = DEFAULT_DIGITS, algorithm = DEFAULT_ALGORITHM } = {},
) {
	const byteCounter = Buffer.from(intToBytes(counter))
	const hmac = crypto.createHmac(algorithm, Buffer.from(key))
	const digest = hmac.update(byteCounter).digest('hex')
	const hashBytes = hexToBytes(digest)
	const offset = hashBytes[19] & 0xf
	let hotp =
		(((hashBytes[offset] & 0x7f) << 24) |
			((hashBytes[offset + 1] & 0xff) << 16) |
			((hashBytes[offset + 2] & 0xff) << 8) |
			(hashBytes[offset + 3] & 0xff)) +
		''
	return hotp.slice(-digits)
}

function verifyHTOP(
	token: string,
	key: string,
	{
		window = DEFAULT_WINDOW,
		counter = 0,
		digits = DEFAULT_DIGITS,
		algorithm = DEFAULT_ALGORITHM,
	} = {},
) {
	for (let i = counter - window; i <= counter + window; ++i) {
		if (generateHOTP(key, { counter: i, digits, algorithm }) === token) {
			return { delta: i - counter }
		}
	}
	return null
}

/**
 *
 * @param options Configuration options for the TOTP.
 * @param options.validSeconds The number of seconds for the OTP to be valid. Defaults to 30.
 * @param options.digits The length of the OTP. Defaults to 6.
 * @param options.algorithm The algorithm to use. Defaults to sha256.
 * @returns
 */
export function generateTOTP({
	validSeconds = DEFAULT_VALID_SECONDS,
	digits = DEFAULT_DIGITS,
	algorithm = DEFAULT_ALGORITHM,
} = {}) {
	const now = new Date().getTime()
	const counter = Math.floor(now / 1000 / validSeconds)
	const key = crypto.randomBytes(digits).toString('hex')
	return {
		key,
		algorithm,
		validSeconds,
		otp: generateHOTP(key, { counter, digits, algorithm }),
	}
}

export function verifyTOTP(
	{ otp, key }: { otp: string; key: string },
	{
		validSeconds = DEFAULT_VALID_SECONDS,
		window = DEFAULT_WINDOW,
		algorithm = DEFAULT_ALGORITHM,
	} = {},
) {
	const now = new Date().getTime()
	const counter = Math.floor(now / 1000 / validSeconds)
	return verifyHTOP(otp, key, { counter, window, algorithm })
}
