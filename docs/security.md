# Security

The Epic Stack has several security measures in place to protect your users and
yourself. This (incomplete) document, explains some of the security measures
that are in place and how to use them.

## TOTP and Two-Factor Authentication

Two factor authentication is built-into the Epic Stack. It's managed using a
custom built TOTP (Time-based One Time Passwords) utility that's been fully
tested with Google Authenticator and 1Password and is based loosely on existing
(but outdated) libraries.

You can read more about the decision to use TOTP in
[the totp decision document](./decisions/014-totp.md). The secret and other
pertinent information is stored in a `verification` model (check the Prisma
schema). This verification model is used as the basis for all TOTP secrets. This
is used for non-expiring Two-Factor Authentication secrets as well as temporary
TOTP codes which are emailed to verify a user's ownership of an email/account.
So it's used for onboarding, forgot password, and change email flows.

When a user has 2FA enabled on their account, they also are required to enter
their 2FA code within 2 hours of performing destructive actions like changing
their email or disabling 2FA. This time is controlled by the
`shouldRequestTwoFA` utility in the `login` full stack component in the resource
routes.

In some cases, entering a TOTP happens in the `/verify` route. This is the
approach taken for email ownership verification. However, in other cases,
verification happens inline to reduce disorienting the user. This is the
approach taken for performing destructive actions.

## Content Security Policy

The Epic Stack uses a strict
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
This means that only resources from trusted sources are allowed to be loaded.
However, by default, the CSP is set to `report-only` which means that the
browser will report violations of the CSP without actually blocking the
resource.

This is to prevent new users of the Epic Stack from being blocked or surprised
by the CSP by default. However, it is recommended to enable the CSP in
`server/index.ts` by removing the `reportOnly: true` option.

## Fly's Internal Network

The Epic Stack uses [Fly](https://fly.io) for hosting. Fly has an internal
network that allows you to connect services to each other without exposing them
to the public internet. Only services within your organization have access to
this network, and only accounts in your organization have access as well.

When running multiple instances of the Epic Stack, your instances communicate
with each other over this internal network. Most of this happens behind the
scenes with the consul service that Fly manages for us.

We also have an endpoint that allows instances to connect to each other to
update the cache in the primary region. This uses internal URLs for that
communication (via [`litefs-js`](https://github.com/fly-apps/litefs-js)), but as
an added layer of security it uses a shared secret to validate the requests.

> This could be changed if there's a way to determine if a request is coming
> from the internal network. But I haven't found a way to do that yet. PRs
> welcome!

Outside of this, the Epic Stack does not access other first-party services or
databases.

## Secrets

The currently recommended policy for managing secrets is to place them in a
`.env` file in the root of the application (which is `.gitignore`d). There is a
`.env.example` which can be used as a template for this file (and if you do not
need to actually connect to real services, this can be used as
`cp .env.example .env`).

These secrets need to also be set on Fly using the `fly secrets` command.

There are significant limitations to this approach and will probably be improved
in the future.

## [Cross-Site Scripting (XSS)](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting)

React has built-in support for XSS protection. It does this by escaping all
values by default. This means that if you want to render HTML, you need to use
the `dangerouslySetInnerHTML` prop. This is a good thing, but it does mean that
you need to be careful when rendering HTML. Never pass anything that is
user-generated to this prop.

## [Cross-Site Request Forgery (CSRF)](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)

There is nothing currently built-into the Epic Stack to prevent CSRF attacks
currently. If this is a concern for you, we recommend you look at
[`remix-utils`](https://github.com/sergiodxa/remix-utils) (already installed)
which has
[CSRF-related utilities](https://github.com/sergiodxa/remix-utils#csrf) that can
be used to avoid these issues.

## Rate Limiting

The Epic Stack uses a rate limiter to prevent abuse of the API. This is
configured in the `server/index.ts` file and can be changed as needed. By
default it uses [`express-rate-limit`](https://npm.im/express-rate-limit) with
the in-memory store. There are trade-offs with this simpler approach, but it
should be relatively simple to externalize the store into Redis as that's a
built-in feature to express-rate-limit.
