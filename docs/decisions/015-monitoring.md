# Monitoring

Date: 2023-06-09

Status: accepted

## Context

Unless you want to be watching your metrics and logs 24/7 you probably want to
be notified when users experience errors in your application. There are great
tools for monitoring your application. I've used Sentry for years and it's
great.

One of the guiding principles of the project is to avoid services. The nature of
application monitoring requires that the monitor not be part of the application.
So, we necessarily need to use a service for monitoring.

One nice thing about Sentry is it is open source so we can run it ourselves if
we like. However, that may be more work than we want to take on at first.

## Decision

We'll set up the Epic Stack to use Sentry and document how you could get it
running yourself if you prefer to self-host it.

We'll also ensure that we defer the setup requirement to later so you can still
get started with the Epic Stack without monitoring in place which is very useful
for experiments and makes it easier to remove or adapt to a different solution
if you so desire.

## Consequences

We tie the Epic Stack to Sentry a bit, but I think that's a solid trade-off for
the benefit of production error monitoring that Sentry provides. People who need
the scale where Sentry starts to cost money (https://sentry.io/pricing/) will
probably be making money at that point and will be grateful for the monitoring.
