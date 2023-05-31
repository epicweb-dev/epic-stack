
// exit with non-zero code if we have everything for Sentry
if (
  process.env.SENTRY_DSN &&
	process.env.SENTRY_ORG &&
	process.env.SENTRY_PROJECT &&
	process.env.SENTRY_AUTH_TOKEN
) {
	process.exit(128)
}