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
 * 1. Generate a secret (crypto.randomBytes(32).toString('hex'))
 * 2. Generate the TOTP with that secret (generateTOTP(secret))
 * 3. Store the secret, digits, and period in the database along with the thing you're verifying (e.g. user email)
 * 4. Send the TOTP to the user (e.g. email it to them)
 * 5. When the user enters the TOTP, verify it (verifyTOTP(token, secret))
 * 6. If the TOTP is valid, delete it from the database and allow the user to proceed
 *
 * Anyone can feel free to turn this into an open source package that we can use
 * in the Epic Stack.
 */
import * as crypto from 'crypto'
import * as base32 from 'thirty-two'

// SHA1 is not secure, but in the context of TOTPs, it's unrealistic to expect
// security issues. Also, it's the default for compatibility with OTP apps.
// That said, if you're acting the role of both client and server and your TOTP
// is longer lived, you can definitely use a more secure algorithm like sha256.
// Learn more: https://www.rfc-editor.org/rfc/rfc4226#page-25 (B.1. SHA-1 Status)
const DEFAULT_ALGORITHM = 'sha1'
const DEFAULT_DIGITS = 6
const DEFAULT_WINDOW = 1
const DEFAULT_PERIOD = 30

type TOTPConfig = {
	period: number
	digits: number
	algorithm: string
}

function generateHOTP(
	secret: Buffer,
	{ counter = 0, digits = DEFAULT_DIGITS, algorithm = DEFAULT_ALGORITHM } = {},
) {
	const byteCounter = Buffer.from(intToBytes(counter))
	const hmac = crypto.createHmac(algorithm, secret)
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

function verifyHOTP(
	otp: string,
	secret: Buffer,
	{
		counter = 0,
		digits = DEFAULT_DIGITS,
		algorithm = DEFAULT_ALGORITHM,
		window = DEFAULT_WINDOW,
	} = {},
) {
	for (let i = counter - window; i <= counter + window; ++i) {
		if (generateHOTP(secret, { counter: i, digits, algorithm }) === otp) {
			return { delta: i - counter }
		}
	}
	return null
}

/**
 * Creates a time-based one-time password (TOTP). This handles creating a random
 * secret (base32 encoded), and generating a TOTP for the current time. As a
 * convenience, it also returns the config options used to generate the TOTP.
 *
 * @param options Configuration options for the TOTP.
 * @param options.period The number of seconds for the OTP to be valid. Defaults to 30.
 * @param options.digits The length of the OTP. Defaults to 6.
 * @param options.algorithm The algorithm to use. Defaults to sha1.
 * @param options.secret The secret to use for the TOTP. Defaults to a random secret.
 * @returns The OTP, secret, and config options used to generate the OTP.
 */
export function generateTOTP({
	period = DEFAULT_PERIOD,
	digits = DEFAULT_DIGITS,
	algorithm = DEFAULT_ALGORITHM,
	secret = base32.encode(crypto.randomBytes(10)).toString(),
}: { secret?: string } & Partial<TOTPConfig> = {}) {
	const otp = generateHOTP(base32.decode(secret), {
		counter: getCounter(period),
		digits,
		algorithm,
	})

	return { otp, secret, period, digits, algorithm }
}

/**
 * Generates a otpauth:// URI which you can use to generate a QR code or users
 * can manually enter into their password manager.
 *
 * @param options Configuration options for the TOTP Auth URI.
 * @param options.period The number of seconds for the OTP to be valid.
 * @param options.digits The length of the OTP.
 * @param options.algorithm The algorithm to use.
 * @param options.secret The secret to use for the TOTP Auth URI.
 * @param options.accountName A way to uniquely identify this Auth URI (in case they have multiple of these).
 * @param options.issuer The issuer to use for the TOTP Auth URI.
 *
 * @returns The OTP Auth URI
 */
export function getTOTPAuthUri({
	period,
	digits,
	algorithm,
	secret,
	accountName,
	issuer,
}: {
	secret: string
	issuer: string
	accountName: string
} & TOTPConfig) {
	const params = new URLSearchParams({
		secret,
		issuer,
		algorithm,
		digits: digits.toString(),
		period: period.toString(),
	})

	const escapedIssuer = encodeURIComponent(issuer)
	const escapedAccountName = encodeURIComponent(accountName)
	const label = `${escapedIssuer}:${escapedAccountName}`

	return `otpauth://totp/${label}?${params.toString()}`
}

/**
 * Verifies a time-based one-time password (TOTP). This handles decoding the
 * secret (base32 encoded), and verifying the OTP for the current time.
 *
 * @param options The otp, secret, and configuration options for the TOTP.
 * @param options.otp The OTP to verify.
 * @param options.secret The secret to use for the TOTP.
 * @param options.period The number of seconds for the OTP to be valid.
 * @param options.digits The length of the OTP.
 * @param options.algorithm The algorithm to use.
 * @param options.window The number of OTPs to check before and after the current OTP. Defaults to 1.
 *
 * @returns an object with "delta" which is the delta between the current OTP and the OTP that was verified, or null if the OTP is invalid.
 */
export function verifyTOTP({
	otp,
	secret,
	period,
	digits,
	algorithm,
	window = DEFAULT_WINDOW,
}: {
	otp: string
	secret: string
	window?: number
} & Partial<TOTPConfig>) {
	return verifyHOTP(otp, base32.decode(secret), {
		counter: getCounter(period),
		digits,
		window,
		algorithm,
	})
}

function intToBytes(num: number) {
	const buffer = Buffer.alloc(8)
	buffer.writeBigInt64BE(BigInt(num))
	return [...buffer]
}

function hexToBytes(hex: string) {
	return [...Buffer.from(hex, 'hex')]
}

function getCounter(period: number = DEFAULT_PERIOD) {
	const now = new Date().getTime()
	const counter = Math.floor(now / 1000 / period)
	return counter
}
