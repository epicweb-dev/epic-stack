# Email Verification Code

Date: 2023-06-05

Status: accepted

## Context

When a new user registers, we need to collect their email address so we can send
them a password reset link if they forget their password. Applications may also
need the email for other reasons, but whatever the case may be, we need their
email address, and to reduce spam and user error, we want to verify the email as
well.

Currently, the Epic Stack will send the email with a link which the user can
then click and start the onboarding process. This works fine, but it often means
the user is left with a previous dead-end tab open which is kind of annoying
(especially if they are on mobile and the email client opens the link in a
different browser).

An alternative to this is to include a verification code in the email and have
the user enter that code into the application. This is a little more work for
the user, but it's not too bad and it means that the user can continue their
work from the same tab they started in.

This also has implications if people want to add email verification for
sensitive operations like password resets. If a code system is in place, it
becomes much easier to add that verification to the password reset process as
well.

## Decision

We will support both options. The email will include a code and a link, giving
the user the option between the two so they can select the one that works best
for them in the situation.

## Consequences

This requires a bit more work, but will ultimately be a better UX and will pave
the way for other features in the future.
