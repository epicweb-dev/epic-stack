import path from 'node:path'
import fsExtra from 'fs-extra'
import { afterAll, beforeEach } from 'vitest'
import { BASE_DATABASE_PATH } from './global-setup.ts'

const poolId = process.env.VITEST_POOL_ID || '0'
const databaseFile = `./tests/prisma/data.${poolId}.db`
const databasePath = path.join(process.cwd(), databaseFile)
process.env.DATABASE_URL = `file:${databasePath}`

const cacheDatabasePath = process.env.CACHE_DATABASE_PATH
if (cacheDatabasePath && cacheDatabasePath !== ':memory:') {
	const parsed = path.parse(cacheDatabasePath)
	const cacheFileName = parsed.ext
		? `${parsed.name}.${poolId}${parsed.ext}`
		: `${parsed.name}.${poolId}`
	const cacheDir = parsed.dir || '.'
	process.env.CACHE_DATABASE_PATH = path.join(cacheDir, cacheFileName)
}

beforeEach(async () => {
	await fsExtra.copyFile(BASE_DATABASE_PATH, databasePath)
})

afterAll(async () => {
	// we *must* use dynamic imports here so the process.env.DATABASE_URL is set
	// before prisma is imported and initialized
	const { prisma } = await import('#app/utils/db.server.ts')
	await prisma.$disconnect()
	await fsExtra.remove(databasePath)
})
