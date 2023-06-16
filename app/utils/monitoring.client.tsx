import { useLocation, useMatches } from '@remix-run/react'
import * as Sentry from '@sentry/remix'
import { useEffect } from 'react'

export function init() {
	Sentry.init({
		dsn: ENV.SENTRY_DSN,
		integrations: [
			new Sentry.BrowserTracing({
				routingInstrumentation: Sentry.remixRouterInstrumentation(
					useEffect,
					useLocation,
					useMatches,
				),
			}),
			// Replay is only available in the client
			new Sentry.Replay(),
		],

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,

		// Capture Replay for 10% of all sessions,
		// plus for 100% of sessions with an error
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
	})
}
