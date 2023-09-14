# Change Email

Date: 2023-07-26

Status: accepted

## Context

For most websites, the user's email is the primary mechanism for authenticity.
You sign up with your email, password reset involves the email, and often you
sign in with your email.

For various reasons, users may wish to maintain their account data, but change
their email address. There are a few important considerations for managing this:

1. The user may no longer have access to the current email address.
1. If the user typos their email address, then they may lose access to their
   account.
1. If an adversary gets temporary access to a user's account, they may be able
   to change the victim's email address to one they own.

There are a few ways to address these concerns. Here are a few things you could
do (some in combination)

- Let the user change the email with no validation
- Notify the new email address of the change
- Notify the old email address of the change
- Require confirmation of the new address before allowing the change
- Require confirmation of the old address before allowing the change
- Require a two-factor code before allowing the change

The ultimate secure approach would be:

- Require a two-factor code and confirmation from the old and new address before
  allowing the change.

This has a few problems:

1. Not all users have 2FA enabled
2. Users don't always have access to their old address

If you really needed that level of security, you could require 2FA and users
could reach out to support if they don't have access to the old email to plead
their case.

However, there's a middle-ground:

- Require a two-factor code from users who have it enabled, receive confirmation
  of the new address, and notify the old address.

This strikes a good balance of being easy for the user, reducing the number of
support requests, and security.

## Decision

We're going to require recent (within the last 2 hours) verification of the
two-factor code if the user has it enabled, require confirmation of the new
address, and notify the old address of the change.

## Consequences

This will require supporting a mechanism for tracking when the last 2FA code was
entered (just storing the time in the session). This will also require a new
verification for confirming the new address (utilizing existing verification
utilities we have for onboarding the user in the first place).

It's a little bit more complicated than just letting the user change their email
address, but will hopefully reduce the problems described.
