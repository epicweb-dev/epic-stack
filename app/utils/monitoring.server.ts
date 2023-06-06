import * as Sentry from '@sentry/remix'

// TODO: Add Prisma integration
export function init() {
	Sentry.init({
		dsn: ENV.SENTRY_DSN,
		tracesSampleRate: 1,
	})
}
