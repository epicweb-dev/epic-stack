# Mock Cache Server in Tests

Date: 2026-02-01

Status: accepted

## Context

Our Vitest suite runs in a Vite-powered environment that attempts to bundle
imports for jsdom tests. The app cache implementation imports `node:sqlite`,
which Vite cannot bundle for client-like environments. This caused CI failures
when Vitest upgraded and began resolving the cache module for jsdom suites.
Additionally, the cache module requires `CACHE_DATABASE_PATH`, which is not
needed for unit tests and creates friction for running tests locally.

## Decision

We will provide a test-only cache server stub and instruct Vite/Vitest to
resolve `cache.server.ts` to this stub when running Vitest. The stub provides
in-memory cache behavior and a minimal `cachified` implementation sufficient
for the tests. Production and development builds continue to use the real
SQLite-backed cache implementation.

## Consequences

- **Stable CI tests**: Vitest no longer tries to bundle `node:sqlite`, and the
  cache module no longer requires `CACHE_DATABASE_PATH` in unit tests.
- **Scoped behavior**: Cache behavior in unit tests is simplified to in-memory
  semantics, so SQLite-specific behavior is not exercised in those tests.
- **No runtime impact**: Only Vitest uses the stub; production and development
  environments remain unchanged.
