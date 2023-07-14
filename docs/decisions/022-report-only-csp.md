# Report-only CSP

Date: 2023-07-14

Status: accepted

## Context

The Epic Stack uses a strict
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
All the reasons for this explained in
[the decision document](./008-content-security-policy.md) still apply. However,
As people adapt the Epic Stack to their own needs, they may easily forget to add
important sources to the CSP. This can lead to a frustrating experience for new
users of the Epic Stack.

There's an option for CSPs called `report-only` which allows the browser to
report CSP violations without actually blocking the resource. This turns the CSP
into an opt-in which follows our [guiding principle](../guiding-principles.md)
of "Minimize Setup Friction" (similar to deferring setup of third-party services
until they're actually needed).

## Decision

Enable report-only on the CSP by default.

## Consequences

New users of the Epic Stack won't be blocked by the CSP by default. But this
also means they won't be as safe by default. We'll need to make sure enforcing
the CSP is documented well.
