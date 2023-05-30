# Database Migrations

Thanks to Prisma, we've got a great mechanism for handling database migrations.
Any migrations necessary are run (by the primary instance only) as part of the
deploy process. You can find this in the `other/litefs.yml` file.

We deploy to multiple instances at once and the way we deploy means we don't
have any downtime during deploys. However, to make this work, you do need to
make sure you can run two versions of your app at once. Specifically, you should
not deploy "breaking schema changes" to your app in a way that will break any
running instances. This is a pretty typical requirement for production
applications.

The basic idea is that you maintain support for any client that is currently
running. In Epic Stack apps that's normally just the currently running version
of the app. So you really only need to worry about "breaking schema changes"
whenever you deploy a new version, but you don't have to worry about avoiding
breaking schema changes for old versions of the app that are no longer running.

In practice, this means you should adopt a "widen then narrow" strategy for
schema migrations. This is a pretty common practice, but here's a simple example
of how this works (each step here is an individual deploy):

1. Widen app to consume A or B
2. Widen db to provide A and B and the app to write to both A and B
3. Narrow app to consume B and only write to B
4. Narrow db to provide B

So, let's say that today your app allows users to provide a "name" and you want
to change that to `firstName` and `lastName` instead. Here's how you'd do that
(again, each of these steps end in a deploy):

1. Widen app to consume `firstName` and `lastName` or `name`. So all new code
   that references the `firstName` and `lastName` fields should fallback to the
   `name` field and not error if the `firstName` and `lastName` fields don't
   exist yet, which it won't at this point.
2. Widen db to provide `firstName` and `lastName` and `name`. So the `name`
   field should be populated with the `firstName` and `lastName` fields. You can
   do this as part of the migration SQL script that you run. The easiest way to
   do this is to generate the migration script to add the fields using
   `prisma migrate` and then modify the script to copy the existing data in the
   `name` field to the `firstName` field (maybe with the help of VSCode Copilot
   😅).
3. Narrow app to consume `firstName` and `lastName` by only writing to those
   fields and removing the fallback to the `name` field.
4. Narrow db to provide `firstName` and `lastName` by removing the `name` field.
   So now you can remove the `name` field from the db schema.

By following this strategy, you can ensure zero downtime deploys and schema
migrations.
