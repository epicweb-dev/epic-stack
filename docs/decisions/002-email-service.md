# Email Service

Date: 2023-05-08

Status: superseded by [017](017-resend-email.md)

## Context

When you're building a web application, you almost always need to send emails
for various reasons. Packages like `nodemailer` make it quite easy to send your
own emails through your own mailserver or a third party's SMTP server as well.

Unfortunately,
[deliverability will suffer if you're not using a service](https://cfenollosa.com/blog/after-self-hosting-my-email-for-twenty-three-years-i-have-thrown-in-the-towel-the-oligopoly-has-won.html).
The TL;DR is you either dedicate your company's complete resources to "play the
game" of email deliverability, or you use a service that does. Otherwise, your
emails won't reliably make it through spam filters (and in some cases it can
just get deleted altogether).

[The guiding principles](https://github.com/epicweb-dev/epic-stack/blob/main/docs/guiding-principles.md)
discourage services and encourage quick setup.

## Decision

We will use a service for sending email. If emails don't get delivered then it
defeats the whole purpose of sending email.

We selected [Resend](https://resend.com/) because it has a generous free
tier and has proven itself in production. However, to help with quick setup, we
will allow deploying to production without the Resend environment variables set
and will instead log the email to the console so during the experimentation
phase, developers can still read the emails that would have been sent.

During local development, the Resend APIs are mocked and logged in the terminal
as well as saved to the fixtures directory for tests to reference.

## Consequences

Developers will need to either sign up for Resend or update the email code to
use another service if they prefer. Emails will actually reach their
destination.
