# Remove CSRF

Date: 2024-01-29

Status: accepted

## Context

Read more about the original CSRF decision in [032-csrf.md](./032-csrf.md).

Modern browser support for `SameSite: Lax` and our use of that for all cookies
means that cookies are not sent on cross-site requests. This means that CSRF
protection is not needed for our cookies.

There are however a few exceptions which motivated the original inclusion of
CSRF:

- GET requests are not protected by `SameSite: Lax` and so are vulnerable to
  CSRF attacks. However, we do not have any GET endpoints that perform mutations
  on the server. The only GET endpoints we have are for fetching data and so
  there is no meaningful CSRF attack that could be performed.
- The `POST /login` endpoint does not require cookies at all and so is
  technically vulnerable to CSRF attacks. But anyone who could exploit this
  endpoint would have to know the user's username and password anyway in which
  case they could just log in as the user directly.

With the addition of the honeypot field to prevent bots from submitting the
login form, the lack of vulnerability due to the cookie configuration, and the
fact that CSRF adds a bit of complexity to the code, it just doesn't seem worth
it to keep CSRF tokens around.

## Decision

Remove CSRF tokens from the codebase.

## Consequences

If someone adds a GET request which does mutate state, then this could be an
issue. However, a CSRF token could be added back for that specific mutation.
Also, if the cookie configuration is changed from `Lax` to `None` (useful in
various contexts, but certainly not a good default), then CSRF tokens would need
to be added back. So we'll add a comment to the code for configuring the cookie
mentioning this.
