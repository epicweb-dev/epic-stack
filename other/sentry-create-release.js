import { createRelease } from '@sentry/remix/scripts/createRelease.js'
import 'dotenv/config'

const DEFAULT_URL_PREFIX = '#build/'
const DEFAULT_BUILD_PATH = 'public/build'

// exit with non-zero code if we have everything for Sentry
if (
	process.env.SENTRY_DSN &&
	process.env.SENTRY_ORG &&
	process.env.SENTRY_PROJECT &&
	process.env.SENTRY_AUTH_TOKEN
) {
	createRelease({}, DEFAULT_URL_PREFIX, DEFAULT_BUILD_PATH)
} else {
	console.log('Missing Sentry environment variables, skipping sourcemap upload.')
}
