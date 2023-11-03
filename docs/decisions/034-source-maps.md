# Source Maps

Date: 2023-11-03

Status: accepted

## Context

Read [016-source-maps](016-source-maps.md) to come up to speed on the context.

Because of our built-in sentry support, we need to generate source maps, but we
do not necessarily need to ship source maps to the client. Despite the arguments
made in the original source map decision document, the benefit of shipping
source maps over not shipping them is reduced thanks to Sentry. And the dangers
are still present.

## Decision

Delete source maps after they've been uploaded to Sentry.

## Consequences

This will mean debugging a production application in the client will be really
hard, but with Sentry properly configured it should definitely not be a problem.
