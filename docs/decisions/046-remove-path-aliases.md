# Remove Path Aliases

Date: 2025-10-23

Status: accepted

## Context

In [031-imports](./031-imports.md), we implemented path aliases using both the
`"imports"` field in `package.json` and the `paths` field in `tsconfig.json`.
This was done as a temporary solution because TypeScript didn't natively support
the `"imports"` field, requiring us to maintain both configurations to get
autocomplete and type checking.

However, TypeScript has now added native support for the `"imports"` field in
`package.json` (as referenced in the original decision's "yet" link). This means
we no longer need the `paths` configuration in `tsconfig.json` to get proper
TypeScript support for our imports.

## Decision

We're removing the path aliases configuration from `tsconfig.json` and relying
solely on the `"imports"` field in `package.json`. This simplifies our
configuration and aligns with the standard Node.js approach.

The `"imports"` field will continue to work as before, providing the same import
resolution functionality, but now with full TypeScript support without requiring
duplicate configuration.

## Consequences

- **Simplified configuration**: We no longer need to maintain both
  `package.json` imports and `tsconfig.json` paths
- **Standard compliance**: We're now using the standard Node.js approach without
  TypeScript-specific workarounds
- **Reduced maintenance**: One less configuration to keep in sync
- **Better tooling support**: TypeScript now natively understands the
  `"imports"` field, providing better IDE support

This supersedes [031-imports](./031-imports.md) as the current approach for
handling imports in the Epic Stack.
