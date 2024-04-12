import { ProfilingIntegration } from '@sentry/profiling-node'
import * as Sentry from '@sentry/remix'

import { prisma } from '#/app/utils/db.server.ts'

export function init() {
	Sentry.init({
		dsn: ENV.SENTRY_DSN,
		environment: ENV.MODE,
		tracesSampleRate: ENV.MODE === 'production' ? 1 : 0,
		denyUrls: [
			/\/resources\/healthcheck/,
			// TODO: be smarter about the public assets...
			/\/build\//,
			/\/favicons\//,
			/\/img\//,
			/\/fonts\//,
			/\/favicon.ico/,
			/\/site\.webmanifest/,
		],
		integrations: [
			new Sentry.Integrations.Http({ tracing: true }),
			new Sentry.Integrations.Prisma({ client: prisma }),
			new ProfilingIntegration(),
		],
		tracesSampler(samplingContext) {
			// ignore healthcheck transactions by other services (consul, etc.)
			if (samplingContext.request?.url?.includes('/resources/healthcheck')) {
				return 0
			}
			return 1
		},
		beforeSendTransaction(event) {
			// ignore all healthcheck related transactions
			//  note that name of header here is case-sensitive
			if (event.request?.headers?.['x-healthcheck'] === 'true') {
				return null
			}

			return event
		},
	})
}
