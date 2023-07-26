import { type Password, type User } from '@prisma/client'
import { redirect } from '@remix-run/node'
import bcrypt from 'bcryptjs'
import { Authenticator, AuthorizationError } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { prisma } from '~/utils/db.server.ts'
import { sessionStorage } from './session.server.ts'
import { z } from 'zod'
import { verifyTOTP } from './totp.server.ts'

export type { User }

export const authenticator = new Authenticator<string>(sessionStorage, {
	sessionKey: 'sessionId',
})

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30

const signInForm = z.object({
	username: z.string(),
	password: z.string(),
	code: z.string().nullable().optional(),
})

export const TwoFactorCodeRequiredError = '2FA code required'
export const TwoFactorCodeInvalidError = '2FA code invalid'

authenticator.use(
	new FormStrategy(async ({ form }) => {
		const { username, password, code } = signInForm.parse({
			username: form.get('username'),
			password: form.get('password'),
			code: form.get('code'),
		})

		const user = await verifyUserPassword({ username }, password)
		if (!user) {
			throw new AuthorizationError('Invalid username or password')
		}
		const verification = await prisma.verification.findUnique({
			where: { target_type: { target: user.id, type: '2fa' } },
			select: { secret: true, algorithm: true, period: true },
		})
		if (verification) {
			if (!code) {
				throw new AuthorizationError(TwoFactorCodeRequiredError)
			}
			const result = verifyTOTP({
				otp: code,
				secret: verification.secret,
				algorithm: verification.algorithm,
				period: verification.period,
				window: 1,
			})
			if (!result) {
				throw new AuthorizationError(TwoFactorCodeInvalidError)
			}
		}
		const session = await prisma.session.create({
			data: {
				expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
				userId: user.id,
			},
			select: { id: true },
		})

		return session.id
	}),
	FormStrategy.name,
)

export async function requireUserId(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const requestUrl = new URL(request.url)
	redirectTo =
		redirectTo === null
			? null
			: redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
	const loginParams = redirectTo
		? new URLSearchParams([['redirectTo', redirectTo]])
		: null
	const failureRedirect = ['/login', loginParams?.toString()]
		.filter(Boolean)
		.join('?')
	const sessionId = await authenticator.isAuthenticated(request, {
		failureRedirect,
	})
	const session = await prisma.session.findFirst({
		where: { id: sessionId },
		select: { userId: true, expirationDate: true },
	})
	if (!session) {
		throw redirect(failureRedirect)
	}
	return session.userId
}

export async function getUserId(request: Request) {
	const sessionId = await authenticator.isAuthenticated(request)
	if (!sessionId) return null
	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		select: { userId: true },
	})
	if (!session) {
		// Perhaps their session was deleted?
		await authenticator.logout(request, { redirectTo: '/' })
		return null
	}
	return session.userId
}

export async function requireAnonymous(request: Request) {
	await authenticator.isAuthenticated(request, {
		successRedirect: '/',
	})
}

export async function resetUserPassword({
	username,
	password,
}: {
	username: User['username']
	password: string
}) {
	const hashedPassword = await bcrypt.hash(password, 10)
	return prisma.user.update({
		where: { username },
		data: {
			password: {
				update: {
					hash: hashedPassword,
				},
			},
		},
	})
}

export async function signup({
	email,
	username,
	password,
	name,
}: {
	email: User['email']
	username: User['username']
	name: User['name']
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)

	const session = await prisma.session.create({
		data: {
			expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
			user: {
				create: {
					email: email.toLowerCase(),
					username: username.toLowerCase(),
					name,
					password: {
						create: {
							hash: hashedPassword,
						},
					},
				},
			},
		},
		select: { id: true, expirationDate: true },
	})
	return session
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyUserPassword(
	where: Pick<User, 'username'> | Pick<User, 'id'>,
	password: Password['hash'],
) {
	const userWithPassword = await prisma.user.findUnique({
		where,
		select: { id: true, password: { select: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

	if (!isValid) {
		return null
	}

	return { id: userWithPassword.id }
}
