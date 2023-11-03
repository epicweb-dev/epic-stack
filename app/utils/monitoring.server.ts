import * as Sentry from '@sentry/remix'
import { prisma } from './db.server.ts'

export function init() {
	Sentry.init({
		dsn: ENV.SENTRY_DSN,
		environment: ENV.MODE,
		tracesSampleRate: 1,
		integrations: [new Sentry.Integrations.Prisma({ client: prisma })],
	})
}
