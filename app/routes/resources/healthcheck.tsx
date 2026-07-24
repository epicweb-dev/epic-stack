// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/healthcheck.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const host =
		request.headers.get('X-Forwarded-Host') ?? request.headers.get('host')

	try {
		// if we can connect to the database and make a simple query
		// and make a HEAD request to ourselves, then we're good.
		// Prefer SELECT 1 over User.count(): count() was producing Slow DB Query
		// Sentry insights on the tiny Fly demo VM without indicating app issues.
		await Promise.all([
			prisma.$queryRaw`SELECT 1`,
			fetch(`${new URL(request.url).protocol}${host}`, {
				method: 'HEAD',
				headers: { 'X-Healthcheck': 'true' },
			}).then((r) => {
				if (!r.ok) return Promise.reject(r)
			}),
		])
		return new Response('OK')
	} catch (error: unknown) {
		console.log('healthcheck ❌', { error })
		return new Response('ERROR', { status: 500 })
	}
}
