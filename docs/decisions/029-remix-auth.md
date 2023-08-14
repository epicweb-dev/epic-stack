# Remix Auth

Date: 2023-08-14

Status: accepted

## Context

At the start of Epic Stack, we were using
[remix-auth-form](https://github.com/sergiodxa/remix-auth-form) for our
username/password auth solution. This worked fine, but it really didn't give us
any value over handling the auth song-and-dance ourselves.

## Decision

Instead of relying on remix-auth for handling authenticating the user's login
form submission, we'll manage it ourselves.

## Consequences

This mostly allows us to remove some code. However, we're going to be keeping
remix auth around for GitHub Auth
