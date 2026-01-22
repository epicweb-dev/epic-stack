import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import {
	cachified as baseCachified,
	verboseReporter,
	mergeReporters,
	type CacheEntry,
	type Cache as CachifiedCache,
	type CachifiedOptions,
	type Cache,
	totalTtl,
	type CreateReporter,
} from '@epic-web/cachified'
import { remember } from '@epic-web/remember'
import { LRUCache } from 'lru-cache'
import { z } from 'zod'
import { updatePrimaryCacheValue } from '#app/routes/admin/cache/sqlite.server.ts'
import { getInstanceInfo, getInstanceInfoSync } from './litefs.server.ts'
import { cachifiedTimingReporter, type Timings } from './timing.server.ts'

const CACHE_DATABASE_PATH = process.env.CACHE_DATABASE_PATH
type DatabaseSync = import('node:sqlite').DatabaseSync
const require = createRequire(import.meta.url)

const cacheDb = remember('cacheDb', createDatabase)

function createDatabase(tryAgain = true): DatabaseSync {
	const parentDir = path.dirname(CACHE_DATABASE_PATH)
	fs.mkdirSync(parentDir, { recursive: true })

	const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')
	const db = new DatabaseSync(CACHE_DATABASE_PATH)
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

const lru = remember(
	'lru-cache',
	() => new LRUCache<string, CacheEntry<unknown>>({ max: 5000 }),
)

export const lruCache = {
	name: 'app-memory-cache',
	set: (key, value) => {
		const ttl = totalTtl(value?.metadata)
		lru.set(key, value, {
			ttl: ttl === Infinity ? undefined : ttl,
			start: value?.metadata?.createdTime,
		})
		return value
	},
	get: (key) => lru.get(key),
	delete: (key) => lru.delete(key),
} satisfies Cache

const isBuffer = (obj: unknown): obj is Buffer =>
	Buffer.isBuffer(obj) || obj instanceof Uint8Array

function bufferReplacer(_key: string, value: unknown) {
	if (isBuffer(value)) {
		return {
			__isBuffer: true,
			data: value.toString('base64'),
		}
	}
	return value
}

function bufferReviver(_key: string, value: unknown) {
	if (
		value &&
		typeof value === 'object' &&
		'__isBuffer' in value &&
		(value as any).data
	) {
		return Buffer.from((value as any).data, 'base64')
	}
	return value
}

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

const getStatement = cacheDb.prepare(
	'SELECT value, metadata FROM cache WHERE key = ?',
)
const setStatement = cacheDb.prepare(
	'INSERT OR REPLACE INTO cache (key, value, metadata) VALUES (?, ?, ?)',
)
const deleteStatement = cacheDb.prepare('DELETE FROM cache WHERE key = ?')
const getAllKeysStatement = cacheDb.prepare('SELECT key FROM cache LIMIT ?')
const searchKeysStatement = cacheDb.prepare(
	'SELECT key FROM cache WHERE key LIKE ? LIMIT ?',
)

export const cache: CachifiedCache = {
	name: 'SQLite cache',
	async get(key) {
		const result = getStatement.get(key)
		const parseResult = cacheQueryResultSchema.safeParse(result)
		if (!parseResult.success) return null

		const parsedEntry = cacheEntrySchema.safeParse({
			metadata: JSON.parse(parseResult.data.metadata),
			value: JSON.parse(parseResult.data.value, bufferReviver),
		})
		if (!parsedEntry.success) return null
		const { metadata, value } = parsedEntry.data
		if (!value) return null
		return { metadata, value }
	},
	async set(key, entry) {
		const { currentIsPrimary, primaryInstance } = await getInstanceInfo()

		if (currentIsPrimary) {
			const value = JSON.stringify(entry.value, bufferReplacer)
			setStatement.run(key, value, JSON.stringify(entry.metadata))
		} else {
			// fire-and-forget cache update
			void updatePrimaryCacheValue({
				key,
				cacheValue: entry,
			}).then((response) => {
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
			deleteStatement.run(key)
		} else {
			// fire-and-forget cache update
			void updatePrimaryCacheValue({
				key,
				cacheValue: undefined,
			}).then((response) => {
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
		sqlite: getAllKeysStatement
			.all(limit)
			.map((row) => (row as { key: string }).key),
		lru: [...lru.keys()],
	}
}

export async function searchCacheKeys(search: string, limit: number) {
	return {
		sqlite: searchKeysStatement
			.all(`%${search}%`, limit)
			.map((row) => (row as { key: string }).key),
		lru: [...lru.keys()].filter((key) => key.includes(search)),
	}
}

export async function cachified<Value>(
	{
		timings,
		...options
	}: CachifiedOptions<Value> & {
		timings?: Timings
	},
	reporter: CreateReporter<Value> = verboseReporter<Value>(),
): Promise<Value> {
	return baseCachified(
		options,
		mergeReporters(cachifiedTimingReporter(timings), reporter),
	)
}
