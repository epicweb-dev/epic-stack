# Remove Cleanup DB

Date: 2024-10-28

Status: accepted

## Context

We have a utility called `cleanupDb` that removes all tables from the database
except for prisma migration tables. The reference to prisma migration tables is
unfortunate because those are an implementation detail that we should not have
to think about.

The goal of `cleanupDb` was to make it easy for tests to reset the database
without having to run `prisma migrate reset` which is too slow for lower level
tests.

We also used `cleanupDb` in the seed file to reset the database before seeding
it.

However, after a lot of work on the tests, we found a much simpler solution to
resetting the database between tests: simply copy/paste the `base.db` file
(which is a fresh database) to `test.db` before each test. We were already doing
this before all the tests. It takes nanoseconds and is much simpler.

For the seed script, it's nice to have the database be completely reset when
running `prisma db seed` (in fact, our seed expects the database to be empty),
but you can get the same behavior as our current `seed` with a fresh database by
running `prisma migrate reset` (which runs the seed script after resetting the
database).

It would be nice to ditch the implementation detail of prisma's tables, so we'd
like to remove this utility.

## Decision

Remove the `cleanupDb` utility and update our CI to run `prisma migrate reset`
instead of `prisma db seed`.

## Consequences

Running `prisma db seed` will fail because the seed script expects the database
to be empty. We could address this by using upsert or something, but really
people should just run `prisma migrate reset` to seed the database (which is
effectively what we used to do before removing `cleanupDb`).
