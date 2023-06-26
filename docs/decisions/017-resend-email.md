# Migrating to Resend

Date: 2023-06-20

Status: accepted

## Context

Mailgun changed their pricing model to make it more difficult to understand what
is available within the free tier which motivated us to re-evaluate our
selection here. While mailgun is still a fine service,
[Resend](https://resend.com/) has caught the attention of several users of the
Epic Stack. It has a generous (and obvious) free tier of 3k emails a month. They
check all the boxes regarding table-stakes features you'd expect from an email
service. On top of those things, the UI is simple and easy to use. It's also a
lot cheaper than Mailgun.

## Decision

We'll migrate to Resend. As a part of this migration, we're going to avoid
coupling ourselves too closely to it to make it easier to switch to another
provider if you so desire. So we'll be using the REST API instead of the SDK.

## Consequences

Code changes are relatively minimal. Only the `app/utils/email.server.ts` util
and the mock for it need to be changed. Then we also need to update
documentation to use the Resend API key instead of the mailgun sending domain,
etc.
