# Troubleshooting

This is the page where we document common errors and how to fix them:

## Content Security Policy violations

If you've received an error like this:

> Refused to load the image 'https://example.com/thing.png' because it violates
> the following Content Security Policy directive: "img-src 'self'".

This means you're trying to add a link to a resource that is not allowed. Learn
more about the decision to add this content security policy (CSP) in
[the decision document](./decisions/008-content-security-policy.md). NOTE: This
is disabled by default as of
[the report-only CSP decision](./decisions/022-report-only-csp.md). It is,
however, recommended to be enabled for security reasons.

To fix this, adjust the CSP to allow the resource you're trying to add. This can
be done in the `server/index.ts` file.

```diff
		contentSecurityPolicy: {
			directives: {
				'connect-src': [
					MODE === 'development' ? 'ws:' : null,
					process.env.SENTRY_DSN ? '*.ingest.sentry.io' : null,
					"'self'",
				].filter(Boolean),
				'font-src': ["'self'"],
				'frame-src': ["'self'"],
-				'img-src': ["'self'", 'data:'],
+				'img-src': ["'self'", 'data:', 'https://*.example.com']
```

## Missing Icons

Epic Stack uses SVG sprite icons for performance reasons. If you've received an
error like this during local development:

> X [ERROR] Could not resolve "../components/ui/icon.tsx"

You need to be manually regenerate the icon with `npm run build:icons`.

See
[the icons decision document](https://github.com/epicweb-dev/epic-stack/blob/main/docs/decisions/020-icons.md)
for more information about icons.
