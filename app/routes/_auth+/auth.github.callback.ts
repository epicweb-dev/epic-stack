import { redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	authenticator,
	getSessionExpirationDate,
	getUserId,
} from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { GITHUB_PROVIDER_NAME } from '~/utils/github-auth.server.ts'
import { combineHeaders } from '~/utils/misc.tsx'
import {
	destroyRedirectToHeader,
	getRedirectCookieValue,
} from '~/utils/redirect-cookie.server.ts'
import { sessionStorage } from '~/utils/session.server.ts'
import { createToastHeaders, redirectWithToast } from '~/utils/toast.server.ts'
import { verifySessionStorage } from '~/utils/verification.server.ts'
import { handleNewSession } from './login.tsx'
import {
	githubIdKey,
	onboardingEmailSessionKey,
	prefilledProfileKey,
} from './onboarding_.github.tsx'

export const ROUTE_PATH = '/auth/github/callback'

const destroyRedirectTo = { 'set-cookie': destroyRedirectToHeader }

export async function loader({ request }: DataFunctionArgs) {
	const reqUrl = new URL(request.url)
	const redirectTo = getRedirectCookieValue(request)
	debugger

	// normally you *really* want to avoid including test/dev code in your source
	// but this is one of those cases where it's worth it to make the dev
	// experience better. The fact is it's basically impossible to test these
	// kinds of integrations.
	if (process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_')) {
		const cookieSession = await sessionStorage.getSession(
			request.headers.get('cookie'),
		)
		const state = cookieSession.get('oauth2:state') ?? 'MOCK_STATE'
		cookieSession.set('oauth2:state', state)
		reqUrl.searchParams.set('state', state)
		request.headers.set(
			'cookie',
			await sessionStorage.commitSession(cookieSession),
		)
		request = new Request(reqUrl.toString(), request)
	}

	const authResult = await authenticator
		.authenticate(GITHUB_PROVIDER_NAME, request, { throwOnError: true })
		.then(
			data => ({ success: true, data }) as const,
			error => ({ success: false, error }) as const,
		)

	if (!authResult.success) {
		console.error(authResult.error)
		throw await redirectWithToast(
			'/login',
			{
				title: 'Auth Failed',
				description: 'There was an error authenticating with GitHub.',
				type: 'error',
			},
			{ headers: destroyRedirectTo },
		)
	}

	// return
	const { data: profile } = authResult

	const existingConnection = await prisma.connection.findUnique({
		select: { userId: true },
		where: { providerId: profile.id },
	})

	const userId = await getUserId(request)

	if (existingConnection && userId) {
		if (existingConnection.userId === userId) {
			return redirectWithToast(
				'/settings/profile/connections',
				{
					title: 'Already Connected',
					description: `Your "${profile.username}" GitHub account is already connected.`,
				},
				{ headers: destroyRedirectTo },
			)
		} else {
			return redirectWithToast(
				'/settings/profile/connections',
				{
					title: 'Already Connected',
					description: `The "${profile.username}" GitHub account is already connected to another account.`,
				},
				{ headers: destroyRedirectTo },
			)
		}
	}

	// If we're already logged in, then link the GitHub account
	if (userId) {
		await prisma.connection.create({
			data: {
				providerName: GITHUB_PROVIDER_NAME,
				providerId: profile.id,
				userId,
			},
		})
		return redirectWithToast(
			'/settings/profile/connections',
			{
				title: 'Connected',
				type: 'success',
				description: `Your "${profile.username}" GitHub account has been connected.`,
			},
			{ headers: destroyRedirectTo },
		)
	}

	// Connection exists already? Make a new session
	if (existingConnection) {
		return makeSession({ request, userId: existingConnection.userId })
	}

	// if the github email matches a user in the db, then link the account and
	// make a new session
	const user = await prisma.user.findUnique({
		select: { id: true },
		where: { email: profile.email.toLowerCase() },
	})
	if (user) {
		await prisma.connection.create({
			data: {
				providerName: GITHUB_PROVIDER_NAME,
				providerId: profile.id,
				userId: user.id,
			},
		})
		return makeSession(
			{ request, userId: user.id },
			{
				headers: await createToastHeaders({
					title: 'Connected',
					description: `Your "${profile.username}" GitHub account has been connected.`,
				}),
			},
		)
	}

	// this is a new user, so let's get them onboarded
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	verifySession.set(onboardingEmailSessionKey, profile.email)
	verifySession.set(prefilledProfileKey, {
		...profile,
		email: profile.email.toLowerCase(),
		username: profile.username?.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
	})
	verifySession.set(githubIdKey, profile.id)
	const onboardingRedirect = [
		'/onboarding/github',
		redirectTo ? new URLSearchParams({ redirectTo }) : null,
	]
		.filter(Boolean)
		.join('?')
	return redirect(onboardingRedirect, {
		headers: combineHeaders(
			{ 'set-cookie': await verifySessionStorage.commitSession(verifySession) },
			destroyRedirectTo,
		),
	})
}

async function makeSession(
	{
		request,
		userId,
		redirectTo,
	}: { request: Request; userId: string; redirectTo?: string | null },
	responseInit?: ResponseInit,
) {
	redirectTo ??= '/'
	const session = await prisma.session.create({
		select: { id: true, expirationDate: true, userId: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId,
		},
	})
	return handleNewSession(
		{ request, session, redirectTo, remember: true },
		{ headers: combineHeaders(responseInit?.headers, destroyRedirectTo) },
	)
}
