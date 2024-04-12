# Caching

The Epic Stack comes with caching utilities and a management dashboard that
allows you to view and clear your cache. There are two caches built into the
Epic Stack:

- **SQLite**: This is a separate database from the main application database.
  It's managed by LiteFS so the data is replicated across all instances of your
  app. This can be used for long-lived cached values.
- **LRU**: This is an in-memory cache that is used to store the results of
  expensive queries or help deduplicate requests for data. It's not replicated
  across instances and as it's in-memory it will be cleared when your app is
  restarted. So this should be used for short-lived cached values.

Caching is intended to be used for data that is expensive and/or slow to compute
or retrieve. It can help you avoid costs or rate limits associated with making
requests to third parties.

It's important to note that caching should not be the first solution to slowness
issues. If you've got a slow query, look into optimizing it with database
indexes before caching the results.

## Using the cache

You won't typically interact directly with the caches. Instead, you will use
[`cachified`](https://www.npmjs.com/package/@epic-web/cachified) which is a nice
abstraction for cache management. We have a small abstraction on top of it which
allows you to pass `timings` to work seamlessly with
[the server timing utility](./server-timing.md).

Let's say we're making a request to tito to get a list of events. Tito's API is
kinda slow and our event details don't change much so we're ok speeding things
up by caching them and utilizing the stale-while-revalidate features in
cachified. Here's how you would use cachified to do this:

```tsx
import { cache, cachified } from '#app/utils/cache.server.ts'
import { type Timings } from '#app/utils/timing.server.ts'

const eventSchema = z.object({
	/* the schema for events */
})

export async function getScheduledEvents({
	timings,
}: {
	timings?: Timings
} = {}) {
	const scheduledEvents = await cachified({
		key: 'tito:scheduled-events',
		cache,
		timings,
		getFreshValue: () => {
			// do a fetch request to the tito API and stuff here
			return [
				/* the events you got from tito */
			]
		},
		checkValue: eventSchema.array(),
		// Time To Live (ttl) in milliseconds: the cached value is considered valid for 24 hours
		ttl: 1000 * 60 * 60 * 24,
		// Stale While Revalidate (swr) in milliseconds: if the cached value is less than 30 days
		// expired, return it while fetching a fresh value in the background
		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 30,
	})
	return scheduledEvents
}
```

With this setup, the first time you call `getScheduledEvents` it will make a
request to the tito API and return the results. It will also cache the results
in the `cache` (which is the SQLite cache). The next time you call
`getScheduledEvents` it will return the cached value if the cached value is less
than 30 days old. If the cached value is older than 24 hours, it will also make
a request to the tito API. If the cache value is more than 30 days old, it will
wait until the tito request is complete and then return the fresh value.

Bottom line: You make the request much less often and users are never waiting
for it. Every situation will require you think through the implications of
caching and acceptable stale-ness, but the point is you have those levers to
pull.

A lot more needs to be said on this subject (an entire workshop full!), but this
should be enough to get you going!
