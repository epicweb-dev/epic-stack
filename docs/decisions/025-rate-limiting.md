# Rate Limiting

Date: 2023-08-10

Status: accepted

## Context

Adversaries can sometimes attempt to break into user's accounts by guessing
their passwords. This is known as a brute force attack.

Or, sometimes a bad guy may not like you and want to do you harm so they will
trigger you to send people a lot of emails by hitting your `/signup` or
`/settings/profile/change-email` endpoint over and over again. Doing this will
reduce your reputation with email providers and may cause your emails to be
flagged as spam.

A common way to reduce the impact and likelihood of this is to rate limit
requests. This means that you only allow a certain number of requests from a
given IP address within a certain time period.

There are established patterns and libraries for doing this. The most popular
and well maintained library for express is
[express-rate-limit](https://npm.im/express-rate-limit).

One challenge with rate limiting in a production environment is if you have
multiple instances of your application running behind a load balancer (which in
our case is Fly). In this case, you need to ensure that the rate limit is
applied across all instances and not just to each individual instance.
`express-rate-limit` allows you to do this by using a shared storage mechanism.
A common solution is Redis or memcached.

Rate limiting doesn't completely eliminate the problem of triggering unsolicited
emails (CSRF tokens will do an even better job of reducing those) but it does
help a great deal.

Another thing to consider is what the rate limit levels will be. The entire
application should not necessarily have the same rate limit. Users of web
applications will often perform many more GET requests than they do POST
requests for example. So some endpoints and methods will require "stronger" rate
limits than others.

## Decision

We will use `express-rate-limit` to rate limit requests to our application. We
will also use the built-in memory storage mechanism as the default. This is good
enough for many applications and is the simplest to implement. Evolving to a
Redis based solution should not require a great deal of extra effort for folks
requiring that additional level of protection.

We'll have a stronger rate limit on non-GET requests in general and an even
stronger rate limit on certain endpoints that are more likely to be abused.

## Consequences

This could mean that folks who are using the application from a shared IP
address (such as a corporate network) may be rate limited more aggressively than
we would like. This is a trade-off we are willing to make for now.

Our default levels for rate limiting could also be overly aggressive for some
people's use cases causing confusion. So we'll need to document this to help
people be made aware of the potential issue and how to resolve it.
