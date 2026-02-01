type CacheEntry<Value> = {
	metadata: {
		createdTime: number
		ttl?: number | null
		swr?: number | null
	}
	value: Value
}

const lruStore = new Map<string, CacheEntry<unknown>>()
const sqliteStore = new Map<string, CacheEntry<unknown>>()

export const lruCache = {
	name: 'test-lru-cache',
	set: (key: string, value: CacheEntry<unknown>) => {
		lruStore.set(key, value)
		return value
	},
	get: (key: string) => lruStore.get(key),
	delete: (key: string) => lruStore.delete(key),
}

export const cache = {
	name: 'test-sqlite-cache',
	async get(key: string) {
		return sqliteStore.get(key) ?? null
	},
	async set(key: string, entry: CacheEntry<unknown>) {
		sqliteStore.set(key, entry)
		return entry
	},
	async delete(key: string) {
		sqliteStore.delete(key)
	},
}

export async function getAllCacheKeys(limit: number) {
	const sqlite = [...sqliteStore.keys()].slice(0, limit)
	const lru = [...lruStore.keys()].slice(0, limit)
	return { sqlite, lru }
}

export async function searchCacheKeys(search: string, limit: number) {
	const matches = (value: string) => value.includes(search)
	const sqlite = [...sqliteStore.keys()].filter(matches).slice(0, limit)
	const lru = [...lruStore.keys()].filter(matches).slice(0, limit)
	return { sqlite, lru }
}

export async function cachified<Value>(
	options: {
		getFreshValue: () => Promise<Value> | Value
	},
): Promise<Value> {
	return options.getFreshValue()
}
