import { useLocation, useMatches } from 'react-router';
import {
	init as sentryInit,
	browserTracingIntegration,
	replayIntegration,
	browserProfilingIntegration,
} from '@sentry/remix'
import { useEffect } from 'react'

export function init() {
	sentryInit({
		dsn: ENV.SENTRY_DSN,
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
			browserTracingIntegration({
				useEffect,
				useLocation,
				useMatches,
			}),
			replayIntegration(),
			browserProfilingIntegration(),
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
