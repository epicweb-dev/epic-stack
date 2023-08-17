# Toasts

Date: 2023-08-14

Status: accepted

## Context

In the Epic Stack we used the Shadcn toast implementation. This worked ok, but
it did require a lot of custom code for ourselves and did a poor job of managing
multiple toast messages.

We also had a shared `flash` session implementation for both toasts and
confetti. This was overly complex.

There's another library
[someone told me about](https://twitter.com/ayushverma1194/status/1674848096155467788)
that is a better fit. It's simpler and has an API sufficient to our use cases.

It's also sufficiently customizable from a design perspective as well. And it's
actively developed.

## Decision

Remove our own toast implementation and use the library instead.

Also separate the toast and confetti session implementations. Toasts can
continue to use a regular session, but confetti will be a much simpler cookie.

## Consequences

This will limit the level of customizability because we're now relying on a
library for managing toast messages, however it also reduces the maintenance
burden for users of the Epic Stack.

This will also simplify the confetti implementation.
