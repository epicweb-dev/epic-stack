# Title

Date: 2023-05-25

Status: accepted

## Context

There are a lot of ways to manage authentication in applications on the web.
We've chosen to use cookies to identify a user. However, you can just stick the
user's ID in that cookie and then sign it with a secret and then you'll always
know that the user ID in the cookie is legitimate and you won't need to go to
the database at all to determine who is making the request (or, at least to know
their ID).

The limitation here is that once a client has a signed cookie with the user ID,
it cannot be revoked. You can set a `maxAge` or a `expires`, but you can't
proactively revoke it. There's also not a great way to know how many sessions
are currently active for a given user.

For many applications, being able to proactively invalidate sessions is
necessary. My own site has this capability. Many sites will even associate some
identifiable information about each session as well as the last time that
session was used to display that information to the user and allow them to
revoke specific sessions.

## Decision

We will add a sessions table to the built-in template's schema allowing a
capability for a simple "revoke all" feature. Adding more information to the
session model would be simple for anyone needing a more sophisticated session
management strategy. This simple implementation gets people on the right foot
with regards to session management.

## Consequences

This requires doing a database lookup for every authenticated request to
determine whether there is an active session in the database for the user's
request. This is not a problem for us since we're using SQLite and there's 0
latency, so the query is extremely fast.

The sessions table does not currently have the capability to proactively delete
expired sessions which means it could fill up indefinitely. This would be a good
problem for built-in cron job support to solve eventually.
