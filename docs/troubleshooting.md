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
					process.env.SENTRY_DSN ? '*.sentry.io' : null,
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

> X [ERROR] Could not resolve "#app/components/ui/icon.tsx"

You need to be manually regenerate the icon with `npm run build`.

See
[the icons decision document](https://github.com/epicweb-dev/epic-stack/blob/main/docs/decisions/020-icons.md)
for more information about icons.

## Hydration Mismatch

If you see this error in the console:

> Warning: Hydration failed because the initial UI does not match
> server-rendered HTML.

Read [this article](https://www.jacobparis.com/content/remix-hydration-errors)
for more information about hydration errors and how to fix them.

If the article does not apply to you, there are a few other things to note.

Often people think the issue is caused by the `nonce` prop being empty on the
client ([like this](https://github.com/epicweb-dev/epic-stack/discussions/768)).
This is not going to be the problem
[unless you're running Firefox during development mode](https://github.com/epicweb-dev/epic-stack/discussions/768#discussioncomment-10456308)
(if that's the case then you can safely ignore it because that's a firefox bug
that only affects development). The browser strips the `nonce` from the DOM
before executing any JavaScript for security reasons and React handles this
fine.

Browser extensions are notorious for causing hydration errors in the Epic Stack.
This is because we're using React to hydrate the entire document and many
browser extensions add content to the `<head>` which triggers a hydration error.

In React 19, React will no longer have issues with differences in the `<head>`
so if you upgrade to React 19, you'll likely no longer see hydration errors for
this reason.
