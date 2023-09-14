# Monitoring

This document describes how to get [Sentry](https://sentry.io/) (the Epic
application monitoring provider) set up for error, performance, and replay
monitoring.

> **NOTE**: this is an optional step and only needed if you want monitoring in
> production.

## SaaS vs Self-Hosted

Sentry offers both a [SaaS solution](https://sentry.io/) and
[self-hosted solution](https://develop.sentry.dev/self-hosted/). This guide
assumes you are using SaaS but the guide still works with self-hosted with a few
modifications.

## Signup

You can sign up for Sentry and create a Remix project from visiting
[this url](https://sentry.io/signup/?project_platform=javascript-remix) and
filling out the signup form.

## Onboarding

Once you see the onboarding page which has the DSN, copy that somewhere (this
becomes `SENTRY_DSN`). Then click
[this](https://sentry.io/orgredirect/settings/:orgslug/developer-settings/new-internal/)
to create an internal integration. Give it a name and add the scope for
`Releases:Admin`. Press Save, find the auth token at the bottom of the page
under "Tokens", and copy that to secure location (this becomes
`SENTRY_AUTH_TOKEN`). Then visit the organization settings page and copy that
organization slug (`SENTRY_ORG_SLUG`).

Now, set the secrets in Fly.io:

```sh
fly secrets set SENTRY_DSN=<your_dsn> SENTRY_AUTH_TOKEN=<your_auth_token> SENTRY_ORG=<your_org_slug> SENTRY_PROJECT=javascript-remix
```

Note that `javascript-remix` is the name of the default Remix project in Sentry
and if you use a different project name you'll need to update that value here.
