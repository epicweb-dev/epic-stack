# Path Aliases

Date: 2023-08-14

Status: accepted

## Context

It's pretty common to configure TypeScript to have path aliases for imports.
This allows you to avoid relative imports and makes it easier to move files
around without having to update imports.

When the Epic Stack started, we used path imports that were similar to those in
the rest of the Remix ecosystem: `~/` referenced the `app/` directory. We added
`tests/` to make it easier to import test utils.

However, we've found that this is confusing for new developers. It's not clear
what `~/` means, and seeing `import { thing } from 'tests/thing'` is confusing.
I floated the idea of adding another alias for `@/` to be the app directory and
or possibly just moving the `~/` to the root and having that be the only alias.
But at the end of the day, we're using TypeScript which will prevent us from
making mistakes and modern editors will automatically handle imports for you
anyway.

At first it may feel like a pain, but less tooling magic is better and editors
can really help reduce the pain. Additionally, we have ESLint configured to sort
imports for us so we don't have to worry about that either. Just let the editor
update the imports and let ESLint sort them.

## Decision

Remove the path aliases from the `tsconfig`.

## Consequences

This requires updating all the imports that utilized the path aliases to use
relative imports.
