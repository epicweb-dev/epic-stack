import type BetterSqlite3 from 'better-sqlite3'
import Database from 'better-sqlite3'
import {
	cachified as baseCachified,
	lruCacheAdapter,
	verboseReporter,
	type CacheEntry,
	type Cache as CachifiedCache,
	type CachifiedOptions,
} from 'cachified'
import fs from 'fs'
import { getInstanceInfo, getInstanceInfoSync } from 'litefs-js'
import LRU from 'lru-cache'
import { z } from 'zod'
import { updatePrimaryCacheValue } from '~/routes/admin+/cache_.sqlite.tsx'
import { time, type Timings } from './timing.server.ts'
import { singleton } from './singleton.server.ts'

const CACHE_DATABASE_PATH = process.env.CACHE_DATABASE_PATH

const cacheDb = singleton('cacheDb', createDatabase)

function createDatabase(tryAgain = true): BetterSqlite3.Database {
	const db = new Database(CACHE_DATABASE_PATH)
	const { currentIsPrimary } = getInstanceInfoSync()
	if (!currentIsPrimary) return db

	try {
		// create cache table with metadata JSON column and value JSON column if it does not exist already
		db.exec(`
			CREATE TABLE IF NOT EXISTS cache (
				key TEXT PRIMARY KEY,
				metadata TEXT,
				value TEXT
			)
		`)
	} catch (error: unknown) {
		fs.unlinkSync(CACHE_DATABASE_PATH)
		if (tryAgain) {
			console.error(
				`Error creating cache database, deleting the file at "${CACHE_DATABASE_PATH}" and trying again...`,
			)
			return createDatabase(false)
		}
		throw error
	}
	return db
}

const lru = singleton(
	'lru-cache',
	() => new LRU<string, CacheEntry<unknown>>({ max: 5000 }),
)

export const lruCache = lruCacheAdapter(lru)

const cacheEntrySchema = z.object({
	metadata: z.object({
		createdTime: z.number(),
		ttl: z.number().nullable().optional(),
		swr: z.number().nullable().optional(),
	}),
	value: z.unknown(),
})
const cacheQueryResultSchema = z.object({
	metadata: z.string(),
	value: z.string(),
})

export const cache: CachifiedCache = {
	name: 'SQLite cache',
	get(key) {
		const result = cacheDb
			.prepare('SELECT value, metadata FROM cache WHERE key = ?')
			.get(key)
		const parseResult = cacheQueryResultSchema.safeParse(result)
		if (!parseResult.success) return null

		const parsedEntry = cacheEntrySchema.safeParse({
			metadata: JSON.parse(parseResult.data.metadata),
			value: JSON.parse(parseResult.data.value),
		})
		if (!parsedEntry.success) return null
		const { metadata, value } = parsedEntry.data
		if (!value) return null
		return { metadata, value }
	},
	async set(key, entry) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const { currentIsPrimary, primaryInstance } = await getInstanceInfo()
		if (currentIsPrimary) {
			cacheDb
				.prepare(
					'INSERT OR REPLACE INTO cache (key, value, metadata) VALUES (@key, @value, @metadata)',
				)
				.run({
					key,
					value: JSON.stringify(entry.value),
					metadata: JSON.stringify(entry.metadata),
				})
		} else {
			// fire-and-forget cache update
			void updatePrimaryCacheValue({
				key,
				cacheValue: entry,
			}).then(response => {
				if (!response.ok) {
					console.error(
						`Error updating cache value for key "${key}" on primary instance (${primaryInstance}): ${response.status} ${response.statusText}`,
						{ entry },
					)
				}
			})
		}
	},
	async delete(key) {
		const { currentIsPrimary, primaryInstance } = await getInstanceInfo()
		if (currentIsPrimary) {
			cacheDb.prepare('DELETE FROM cache WHERE key = ?').run(key)
		} else {
			// fire-and-forget cache update
			void updatePrimaryCacheValue({
				key,
				cacheValue: undefined,
			}).then(response => {
				if (!response.ok) {
					console.error(
						`Error deleting cache value for key "${key}" on primary instance (${primaryInstance}): ${response.status} ${response.statusText}`,
					)
				}
			})
		}
	},
}

export async function getAllCacheKeys(limit: number) {
	return {
		sqlite: cacheDb
			.prepare('SELECT key FROM cache LIMIT ?')
			.all(limit)
			.map(row => (row as { key: string }).key),
		lru: [...lru.keys()],
	}
}

export async function searchCacheKeys(search: string, limit: number) {
	return {
		sqlite: cacheDb
			.prepare('SELECT key FROM cache WHERE key LIKE ? LIMIT ?')
			.all(`%${search}%`, limit)
			.map(row => (row as { key: string }).key),
		lru: [...lru.keys()].filter(key => key.includes(search)),
	}
}

export async function cachified<Value>({
	request,
	timings,
	...options
}: CachifiedOptions<Value> & {
	request?: Request
	timings?: Timings
}): Promise<Value> {
	let cachifiedResolved = false
	const cachifiedPromise = baseCachified({
		reporter: verboseReporter(),
		...options,
		getFreshValue: async context => {
			// if we've already retrieved the cached value, then this may be called
			// after the response has already been sent so there's no point in timing
			// how long this is going to take
			if (!cachifiedResolved && timings) {
				return time(() => options.getFreshValue(context), {
					timings,
					type: `getFreshValue:${options.key}`,
					desc: `request forced to wait for a fresh ${options.key} value`,
				})
			}
			return options.getFreshValue(context)
		},
	})
	const result = await time(cachifiedPromise, {
		timings,
		type: `cache:${options.key}`,
		desc: `${options.key} cache retrieval`,
	})
	cachifiedResolved = true
	return result
}
