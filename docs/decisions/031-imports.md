# Imports

Date: 2023-08-16

Status: superseded by [046-remove-path-aliases](./046-remove-path-aliases.md)
due to TypeScript's native support for the `"imports"` field in package.json.

## Context

Recently, we removed the `~/*` and `tests/*` aliases in favor of relative
imports. The arguments for this are described in
[026-path-aliases](./026-path-aliases.md). While the arguments are sound, the
big challenge with this approach is the fact that there are some times where you
need to type out the import for something and doing that is a huge pain with
relative routes.

The issue is the fact that you can choose one of these options:

1. Very flat files
2. Long relative imports
3. Path aliases

Keeping files flat is just not a great option because it requires exceedingly
long filenames for longer routes and it makes it hard to find files. Long
relative imports are just a pain to type out and they are hard to read, copy,
and manually modify.

Despite the magic of Path aliases, they are actually a standard `package.json`
supported feature. Sort of.
[The `"imports"` field](https://nodejs.org/api/packages.html#imports) in
`package.json` allows you to configure aliases for your imports.
TypeScript also uses this for its own Path aliases since version 5.4
so you get autocomplete and type checking for your imports.

By using the `"imports"` field, you don't have to do any special configuration
for `vitest` or `eslint` to be able to resolve imports. They just resolve them
using the standard.

One interesting requirement for `imports` is that they _must_ start with the `#`
character to disambiguate from other imports. This is a bit annoying, but it's
something that's not difficult to get used to. They also _must not_ start with
`#/`. So you have to do `#app` instead of `#/app`. This is also a bit odd, but
again it's just a matter of familiarity. So it's no big deal.

## Decision

We're going to configure `"imports"` in the `package.json` to use path aliases for imports.

We'll set it to `"#*": "./*"` which will allow us to import anything in the root
of the repo with `#<dirname>/<filepath>`.

## Consequences

This is unfortunately _very_ soon after making the decision to drop the alias.

If someone wants to use the Epic Stack without Node.js, and their runtime
doesn't support `package.json` imports (I'm not sure whether other runtimes do
or not) they'll have to continue using the paths configuration. But that's not a
consideration here.

## Credits

Big thank you to
[Mateusz Burzyński](https://twitter.com/AndaristRake/status/1691807097078317287)
for helping with this one!
