import { nodeProfilingIntegration } from '@sentry/profiling-node'
import * as Sentry from '@sentry/react-router'

Sentry.init({
	// Sentry will only send requests if the dsn is defined
	dsn:
		process.env.NODE_ENV === 'production' ? process.env.SENTRY_DSN : undefined,
	// See https://spotlightjs.com/ for how to install the Spotlight Desktop app for local development
	spotlight: process.env.NODE_ENV === 'development',
	environment: process.env.SENTRY_ENVIRONMENT,
	denyUrls: [
		/\/resources\/healthcheck/,
		// TODO: be smarter about the public assets...
		/\/favicons\//,
		/\/img\//,
		/\/fonts\//,
		/\/favicon.ico/,
		/\/site\.webmanifest/,
	],
	integrations: [
		Sentry.prismaIntegration(),
		Sentry.httpIntegration(),
		nodeProfilingIntegration(),
		Sentry.consoleLoggingIntegration(),
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
	// Enable logs to be sent to Sentry
	enableLogs: true,
})
