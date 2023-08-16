# GitHub Auth

Date: 2023-08-14

Status: accepted

## Context

Many applications require integrating with third party authentication providers.
For this reason, we want to support the idea of "connections" as a built-in part
of the Epic Stack.

There are many different providers we could support, but many people need to
support more than just one. By building things in a way that allows us to
support more than just a single auth provider, it allows us to also make it easy
to swap to a different provider as needed.

Many auth providers support OAuth2, but increasingly, many are also supporting
OpenID Connect. OpenID Connect is a layer on top of OAuth2 that provides a
standardized way to get user information from the auth provider.

Sadly, GitHub (a common popular auth provider for many developer-focused apps)
does not support OpenID, however, by using
[`remix-auth`](https://github.com/sergiodxa/remix-auth), we can easily support
GitHub as a built-in implementation and allow people to swap it out for whatever
OAuth2 or OIDC auth provider they have (if OIDC, they can use
[web-oidc](https://github.com/sergiodxa/web-oidc)).

## Decision

We will update the database schema to support multiple auth providers with a
model called `Connection`:

```prisma
model Connection {
  id           String @id @default(cuid())
  providerName String
  providerId   String @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  userId String

  @@unique([providerName, providerId])
  @@unique([providerId, userId])
}
```

We'll also build the appropriate callback URL handlers and UI to allow people to
manage their connections.

## Consequences

With third party auth, this means that users may not have passwords. So we'll
need to handle that situation and allow users to onboard without the use of
passwords. We'll also need to prevent them from deleting all their connections
until they've created a password.

There are a number of states for the user to be in within the callback as well
which all will need to be considered. All of these states will be tested to
ensure they continue to function properly as people tune things for their needs.

Additionally, we'll need to account for the fact that some folks don't want to
set up the GitHub login flow from the start (to keep in line with our
[Minimize Setup Friction guiding principle](#app/guiding-principles.md)), so
we'll have to make sure that the app still runs properly without GitHub auth
configured.
