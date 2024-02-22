# Adopting Vite

Date: 2026-02-22

Status: accepted

## Context

[The Remix Team has created a Vite Plugin](https://remix.run/blog/remix-vite-stable)
and it is now stable. It can be used to replace the existing remix compiler. In
Remix v3 the plugin will be the only supported way to build remix applications.

Using vite also means we get better hot module replacement, a thriving ecosystem
of tools, and shared efforts with other projects using vite.

If we don't adopt vite, we'll be stuck on Remix v2 forever 🙃 Now that the vite
plugin is stable, adopting vite is really the only way forward.

That said, we currently have a few route modules that mix server-only utilities
with server/client code. In vite, you cannot have any exported functions which
use server-only code, so those utilities will need to be moved. Luckily, the
vite plugin will fail the build if it finds any issues so if it builds, it
works. Additionally, this will help us make a cleaner separation between server
and server/client code which is a good thing.

## Decision

Adopt vite.

## Consequences

Everything is better.
