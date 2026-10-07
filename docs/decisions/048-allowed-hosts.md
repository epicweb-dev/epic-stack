# Allowed Hosts

Date: 2026-10-07

Status: accepted

## Context

`getDomainUrl` builds the app's origin from the `X-Forwarded-Host` or `Host`
request headers. We use it to build the verification links we email to users
(signup, password reset, and email change), the passkey relying party ID and
origin, and the image optimizer's allowed origins.

Both headers can be set by the client, and a proxy won't necessarily strip or
overwrite `X-Forwarded-Host`. That means anyone could trigger an email to a user
that contains a genuine verification code in a link pointing to a host they
control.

We considered requiring a single canonical origin environment variable (like
`APP_URL`), but that would break every existing app that doesn't set it, and it
doesn't handle apps served from more than one hostname (like `example.com` and
`www.example.com`).

## Decision

`getDomainUrl` only uses the request's host if it's trusted. Trusted hosts are:

- The comma-separated hostnames in a new optional `ALLOWED_HOSTS` environment
  variable
- `${FLY_APP_NAME}.fly.dev` (`FLY_APP_NAME` is set automatically by Fly)
- `localhost`, `127.0.0.1`, and `[::1]` on any port

If the request's host isn't trusted, we use the canonical host: the first entry
in `ALLOWED_HOSTS`, then `${FLY_APP_NAME}.fly.dev`, then `localhost:${PORT}`.

## Consequences

Apps deployed to Fly without a custom domain keep working with no configuration.
Apps on a custom domain need to set `ALLOWED_HOSTS` or their emailed links will
point to the `fly.dev` hostname and passkeys won't work on the custom domain.
Development over a LAN IP (rather than localhost) needs that IP added to
`ALLOWED_HOSTS` for emailed links to use it.
