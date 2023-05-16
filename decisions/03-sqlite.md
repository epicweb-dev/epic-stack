# SQLite

Date: 2023-05-13

Status: accepted

## Context

SQLite is a sql-based database with a particularly unique feature: the entire
database is in a single file. Largely for this reason, I've historically seen it
as a simple database for simple use cases.

However, in recent years SQLite has received a great deal of development and
attention making it a simple database for even more advanced use cases. The fact
that SQLite is a single file on disk comes with a major benefit of 0 latency
which
[drastically reduces the "n+1 problem"](https://www.sqlite.org/np1queryprob.html).

Another issue is database size, however,
[SQLite is capable of handling databases that are an Exabyte in size](https://sqlite.org/hctree/doc/hctree/doc/hctree/index.html)
(that's one million Terabytes, or one billion Gigabytes 🤯).

SQLite does not support subscriptions which can be a limitation on certain
real-time use cases. However, there are plenty of reasons to recommend against
using database subscriptions for real-time use cases anyway, and that is the
case in the Epic Stack (as of today, we don't have real-time examples or docs,
but when we do it's likely we wouldn't use database subscriptions anyway).

SQLite being a file on disk does make connecting from external clients
effectively impossible. This makes it more difficult to connect to it using
database admin tools. However, it is possible to run tools like `prisma studio`
on the machine where the sqlite volume is mounted if necessary. And the
`Dockerfile` is already configured to allow easy SSH connections into the sqlite
CLI. This is nowhere near as good as a proper admin tool, but there's likely
more that could be done here to improve the experience. On my own website
(kentcdodds.com), I am able to have prisma studio run in production protected by
authentication and I expect we'll be able to add something like that to the Epic
Stack in the future.

SQLite does not support plugins like
[TimescaleDB](https://github.com/timescale/timescaledb) for Postgres. While
time-series data is possible with SQLite, I do not have experience with this use
case and can't speak to the challenges there. My intuition says it's not
advisable to use SQLite for that use case.

SQLite does not support enums which means you're forced to use strings. I have
mixed feelings about this, but I mostly don't like enums anyway. The main
drawback to this is when it comes to the typings for the client which doesn't
allow you to ensure all values of a column are only within a set of specific
possible values for the string. However, with Prisma client extensions, handling
this kind of enforcement at the client (and typing) level should be possible.
This would need to be documented in the future
[#29](https://github.com/epicweb-dev/epic-stack/issues/29).

As a file on disk, you cannot "distribute" SQLite directly. However, with tools
like [Turso](https://turso.tech/) or [LiteFS](https://fly.io/docs/litefs), you
can make that work. And both of these tools even have built-in solutions to the
"Read Replica Consistency" challenge. So if you need your app to run in multiple
instances, you need to use one of these tools.

Using SQLite is an _enormous_ simplification both during development and
production. With one less service to worry about (especially something as
critical as your database), you're less likely to experience an outage.
Additionally, all you need is a persisted volume for your application (which you
would need for a database service anyway), so it's less costly as well.

## Decision

We'll use SQLite because it satisfies the use cases of our target audience.

## Consequences

This means we need to have a way to connect to our SQLite database in
production. We'll also need to have a way to easily seed the database
(documentation will need to be written and perhaps some scripts). We want to
support multi-region so LiteFS needs to be configured.

This also means real-time use cases will need to find a solution that doesn't
rely on database subscriptions.

Ultimately, this decision drastically simplifies development, deployment,
maintenance, and services for the web application and reduces running costs. A
huge win for the majority of web applications.
