import { invariant } from '@epic-web/invariant'
import { redirect } from '@remix-run/node'
import bcrypt from 'bcryptjs'
import { gt, and, eq, sql, type InferSelectModel } from 'drizzle-orm'
import { Authenticator } from 'remix-auth'
import { safeRedirect } from 'remix-utils/safe-redirect'
import {
	Connection,
	Password,
	Role,
	RoleToUser,
	Session,
	User,
	UserImage,
} from '#drizzle/schema.ts'
import { connectionSessionStorage, providers } from './connections.server.ts'
import { drizzle } from './db.server.ts'
import { combineHeaders, downloadFile } from './misc.tsx'
import { type ProviderUser } from './providers/provider.ts'
import { authSessionStorage } from './session.server.ts'

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
	new Date(Date.now() + SESSION_EXPIRATION_TIME)

export const sessionKey = 'sessionId'

export const authenticator = new Authenticator<ProviderUser>(
	connectionSessionStorage,
)

for (const [providerName, provider] of Object.entries(providers)) {
	authenticator.use(provider.getAuthStrategy(), providerName)
}

export async function getUserId(request: Request) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	if (!sessionId) return null
	const session = await drizzle.query.Session.findFirst({
		with: { user: { columns: { id: true } } },
		where: and(
			eq(Session.id, sessionId),
			gt(Session.expirationDate, new Date()),
		),
	})
	if (!session?.user) {
		throw redirect('/', {
			headers: {
				'set-cookie': await authSessionStorage.destroySession(authSession),
			},
		})
	}
	return session.user.id
}

export async function requireUserId(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const userId = await getUserId(request)
	if (!userId) {
		const requestUrl = new URL(request.url)
		redirectTo =
			redirectTo === null
				? null
				: (redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`)
		const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
		const loginRedirect = ['/login', loginParams?.toString()]
			.filter(Boolean)
			.join('?')
		throw redirect(loginRedirect)
	}
	return userId
}

export async function requireAnonymous(request: Request) {
	const userId = await getUserId(request)
	if (userId) {
		throw redirect('/')
	}
}

export async function login({
	username,
	password,
}: {
	username: InferSelectModel<typeof User>['username']
	password: string
}) {
	const user = await verifyUserPassword({ username }, password)
	if (!user) return null
	const [session] = await drizzle
		.insert(Session)
		.values({
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		})
		.returning({
			id: Session.id,
			expirationDate: Session.expirationDate,
			userId: Session.userId,
		})
	return session
}

export async function resetUserPassword({
	username,
	password,
}: {
	username: InferSelectModel<typeof User>['username']
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)
	return drizzle
		.update(Password)
		.set({ hash: hashedPassword })
		.from(User)
		.where(and(eq(User.username, username), eq(User.id, Password.userId)))
}

export async function signup({
	email,
	username,
	password,
	name,
}: {
	email: InferSelectModel<typeof User>['email']
	username: InferSelectModel<typeof User>['username']
	name: InferSelectModel<typeof User>['name']
	password: string
}) {
	return await drizzle.transaction(async (tx) => {
		const [user] = await tx
			.insert(User)
			.values({
				email: email.toLowerCase(),
				username: username.toLowerCase(),
				name,
			})
			.returning()

		invariant(user, 'failed to create user')

		await tx.insert(Password).values({
			hash: await getPasswordHash(password),
			userId: user.id,
		})

		await tx.insert(RoleToUser).select(
			tx
				.select({
					roleId: Role.id,
					userId: sql.raw(`'${user.id}'`).as('userId'),
				})
				.from(Role)
				.where(eq(Role.name, 'user')),
		)

		const [session] = await tx
			.insert(Session)
			.values({
				expirationDate: getSessionExpirationDate(),
				userId: user.id,
			})
			.returning()

		invariant(session, 'failed to create session')

		return session
	})
}

export async function signupWithConnection({
	email,
	username,
	name,
	providerId,
	providerName,
	imageUrl,
}: {
	email: InferSelectModel<typeof User>['email']
	username: InferSelectModel<typeof User>['username']
	name: InferSelectModel<typeof User>['name']
	providerId: InferSelectModel<typeof Connection>['providerId']
	providerName: InferSelectModel<typeof Connection>['providerName']
	imageUrl?: string
}) {
	return await drizzle.transaction(async (tx) => {
		const [user] = await tx
			.insert(User)
			.values({
				email: email.toLowerCase(),
				username: username.toLowerCase(),
				name,
			})
			.returning()

		invariant(user, 'failed to create user')

		await tx.insert(RoleToUser).select(
			tx
				.select({
					roleId: Role.id,
					userId: sql.raw(`'${user.id}'`).as('userId'),
				})
				.from(Role)
				.where(eq(Role.name, 'user')),
		)

		await tx.insert(Connection).values({
			providerId,
			providerName,
			userId: user.id,
		})

		if (imageUrl) {
			await tx.insert(UserImage).values({
				...(await downloadFile(imageUrl)),
				userId: user.id,
			})
		}

		const [session] = await tx
			.insert(Session)
			.values({
				expirationDate: getSessionExpirationDate(),
				userId: user.id,
			})
			.returning()

		invariant(session, 'failed to create session')

		return session
	})
}

export async function logout(
	{
		request,
		redirectTo = '/',
	}: {
		request: Request
		redirectTo?: string
	},
	responseInit?: ResponseInit,
) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	// if this fails, we still need to delete the session from the user's browser
	// and it doesn't do any harm staying in the db anyway.
	if (sessionId) {
		// the .catch is important because that's what triggers the query.
		void drizzle
			.delete(Session)
			.where(eq(Session.id, sessionId))
			.catch(() => {})
	}
	throw redirect(safeRedirect(redirectTo), {
		...responseInit,
		headers: combineHeaders(
			{ 'set-cookie': await authSessionStorage.destroySession(authSession) },
			responseInit?.headers,
		),
	})
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyUserPassword(
	where:
		| Pick<InferSelectModel<typeof User>, 'username'>
		| Pick<InferSelectModel<typeof User>, 'id'>,
	password: InferSelectModel<typeof Password>['hash'],
) {
	const userWithPassword = await drizzle.query.User.findFirst({
		where:
			'username' in where
				? eq(User.username, where.username)
				: eq(User.id, where.id),
		with: { password: { columns: { hash: true } } },
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
