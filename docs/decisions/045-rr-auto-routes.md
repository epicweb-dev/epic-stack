# React Router Auto Routes

Date: 2025-10-15

Status: proposed

## Context

Epic Stack has relied on `remix-flat-routes` to turn the `app/routes` directory
into the route manifest React Router consumes at build time. The library helped
us introduce file-system routing with predictable conventions and has served the
project well. However, its hybrid convention with `+` suffix treats colocation
as the default pattern, which can lead to less organized route structures as
applications grow.

We now have
[`react-router-auto-routes`](https://github.com/kenn/react-router-auto-routes),
designed to align with React Router's native conventions and APIs. It keeps the
project close to upstream conventions, lowers the surface of custom tooling we
need to maintain, and gives us a clearer migration path as React Router evolves.

## Decision

We will replace `remix-flat-routes` with `react-router-auto-routes` for
generating the application's route manifest. The new tool will become part of
the build and dev pipelines, and any previous configuration specific to
`remix-flat-routes` will be ported to the new conventions.

## Consequences

- Auto route generation follows React Router's conventions, reducing the risk of
  breakage when we upgrade React Router in the future.
- Contributors adopt the naming and organization rules defined by
  `react-router-auto-routes`, so we also updated documentation and examples to
  reflect the new folder semantics.
- All existing functionality has been validated with `npm run validate` and
  works correctly with the new routing system.
