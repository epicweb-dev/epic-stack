import * as Sentry from '@sentry/react-router'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

Sentry.init({
	// Sentry will only send requests if SENTRY_DSN is defined
	dsn: ENV.MODE === 'production' ? ENV.SENTRY_DSN : undefined,
	// See https://spotlightjs.com/ for how to install the Spotlight Desktop app for local development
	spotlight: ENV.MODE === 'development',
	environment: ENV.MODE,
	beforeSend(event) {
		if (event.request?.url) {
			const url = new URL(event.request.url)
			if (
				url.protocol === 'chrome-extension:' ||
				url.protocol === 'moz-extension:'
			) {
				// This error is from a browser extension, ignore it
				return null
			}
		}
		return event
	},
	integrations: [
		Sentry.reactRouterTracingIntegration(),
		Sentry.replayIntegration(),
	],

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,

	// Capture Replay for 10% of all sessions,
	// plus for 100% of sessions with an error
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	enableLogs: true,
})

startTransition(() => {
	hydrateRoot(document, <HydratedRouter />)
})
