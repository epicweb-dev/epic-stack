import { PrismaInstrumentation } from '@prisma/instrumentation'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import * as Sentry from '@sentry/react-router'
import {
	isHealthcheckTransaction,
	shouldDropErrorEvent,
} from '../../app/utils/sentry-event-filters.ts'

export function init() {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV,
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
		ignoreErrors: [
			// Bots/scanners hitting routes without the matching loader/action/method.
			/did not provide an `action`/,
			/did not provide a `loader`/,
			/^Invalid request method /,
		],
		integrations: [
			Sentry.prismaIntegration({
				prismaInstrumentation: new PrismaInstrumentation(),
			}),
			Sentry.httpIntegration(),
			nodeProfilingIntegration(),
		],
		tracesSampler(samplingContext) {
			// ignore healthcheck transactions by other services (consul, etc.)
			if (samplingContext.request?.url?.includes('/resources/healthcheck')) {
				return 0
			}
			return process.env.NODE_ENV === 'production' ? 1 : 0
		},
		beforeSend(event) {
			if (shouldDropErrorEvent(event)) {
				return null
			}
			return event
		},
		beforeSendTransaction(event) {
			// Drop Fly/consul healthchecks, including orphaned Prisma spans that
			// surface as Slow DB Query insights with transaction prisma:client:operation.
			if (isHealthcheckTransaction(event)) {
				return null
			}

			return event
		},
	})
}
