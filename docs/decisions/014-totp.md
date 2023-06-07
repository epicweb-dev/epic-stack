# TOTP (Time-based One-time Password Algorithm)

Date: 2023-06-06

Status: accepted

## Context

As explained in [013-email-code.md](./013-email-code.md), user registration
requires email verification. To verify the email address, we send the user an
email with a magic link that includes an encrypted payload. We do something
similar for the "forgot password" flow as well.

Early on, it was decided to not bother creating a record with the database for
new users. This simplifies things a bit, but it also means that the salt is the
same for all users which technically opens us up for
[rainbow table](https://en.wikipedia.org/wiki/Rainbow_table) attacks. We could
also have implemented this using JWTs because the payload doesn't actually
contain any sensitive information and all we need is to verify that someone else
didn't generate the token (which is what JWTs enable).

The real issue is that since the payload is known (our source for this is
literally open) and the salt is known (it's the same for all users), a dedicated
adversary with enough time and resources could brute-force their way to
determine the `ENCRYPTION_SECRET`... Or a disgruntled employee could leak it.

If the `ENCRYPTION_SECRET` were to somehow determined by an adversary, it would
allow them to generate magic links for any email address and login as any user.
Even if the risk is a little low, it's still a risk that would be nice to avoid
provided it didn't impose an enormous effort.

One way I explored for reducing this risk is rotating the encryption secret by
having a special database table for storing the secret and then having a
background job that rotates the secret every so often. This would also mean that
we need to keep old secrets around for as long as the encrypted data is valid so
we can decrypt it. We don't yet have background job support, but we're planning
on adding it eventually (we probably should do something like this for our
`INTERNAL_COMMAND_TOKEN` in the future). In any case, it would be nice to avoid
the extra complexity.

And so we come to TOTP (Time-based One-Time Passwords). TOTP is a standard for
generating one-time passwords that are only valid for a specific amount of time.
The most common example of this is the 2FA codes that you get when logging into
a website.
[Read how TOTP works on Wikipedia](https://en.wikipedia.org/wiki/Time-based_one-time_password).
In our case it's pretty simple because we are both the client and server.

Here's the TL;DR:

1. Generate a secret key
2. Generate the TOTP with that key
3. Store the key and the TOTP in the database along with the thing you're
   verifying (like the user's email address)
4. Send the TOTP to the user (email it to them)
5. When the user enters the TOTP, verify it against the one in the database
   that's associated with the thing they're verifying
6. If the TOTP is valid, delete it from the database and allow the user to
   proceed

So yeah, it's literally a short-lived, one-time password.

Think of it this way: Before, we generated a one-time password (the token of the
magic link) using the same secret. Now we generate a one-time password using a
random secret. It becomes impossible for someone to brute-force discovery of our
secret.

**Why not just send the secret key instead of generating a TOTP?** First of all,
we want to make sure this is something easy for a user to type in. A 6-digit
number is much easier to type than a 32-character string. So we could make the
secret key be 6 digits long, but the other benefit of the TOTP is that it
expires after a certain amount of time by design. So brute force attacks are
much less likely to succeed.

On top of all that, putting this together makes features like 2FA much easier to
implement because we can just reuse the same code.

One unfortunate aspect of using a TOTP instead of an environment variable is you
now need to store the secret key in the database. Personally I really liked that
the email verification was effectively stateless, but I think the security
benefits of using a TOTP outweigh the costs.

As for generating the TOTP, there are a few libraries for this, but every one
that I could find either did way too much or hasn't been updated in many years
and has a number of flaws and limitations. So we'll need to implement our own
based on the simplest implementation I could find: [`notp`](https://npm.im/notp)
(it doesn't support custom algorithms and uses `sha1` 😬). A perfectly good TOTP
can be generated in less than a hundred lines of Node.js code.

A lot of this is inspired by
[this conversation with ChatGPT 4](https://chat.openai.com/share/a1bbd00d-c9d7-4846-a9af-12c6a475cd20).
It's a really good conversation and I recommend reading it.

## Decision

We'll change the magic link token to be an TOTP instead of an encrypted payload.

## Consequences

This makes it much easier to implement the email code verification feature
decided on in [013-email-code.md](./013-email-code.md). It also makes it easier
to implement 2FA which we'll do in the future. This also allows us to remove the
`ENCRIPTION_SECRET` from the list of environment variables you need to manage.
And we can swap the `encryption.server.ts` utility for a `totp.server.ts`
utility which, while not simpler is a fair trade (and could definitely be
developed and externalized into an open source library).

This also means we now need a new table in the database. This can be designed in
such a way that there's no migration cost and it's purely additive.

Eventually, we'll want to set up a background job that deletes expired TOTPs
from the database. It's not a ship stopper for this feature, but something we'll
want to have implemented eventually (the same applies to expired sessions as
well).
