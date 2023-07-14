# Content Security Policy

Date: 2023-05-27

Status: accepted

Update: [022-report-only-csp.md](./022-report-only-csp.md)

## Context

A Content Security Policy (CSP) allows a server to inform the browser about the
sources from which it expects to load resources. This helps to prevent
cross-site scripting (XSS) attacks by not allowing the browser to load resources
from any other location than the ones specified in the CSP.

CSPs that are overly strict can be a major pain to work with, especially when
using third-party libraries. Still, for the most security, the CSP should be as
strict as possible. Additional sources can be added to the CSP as needed.

## Decision

We configure a tight CSP for the default application using
[helmet](https://npm.im/helmet) which is a de-facto standard express middleware
for configuring security headers.

## Consequences

Applications using the Epic Stack will start with a safer default configuration
for their CSP. It's pretty simple to add additional sources to the CSP as
needed, but it could definitely be confusing for folks who are unaware of the
CSP to load resources. Documentation will be needed to help people understand
what to do when they get CSP errors.
