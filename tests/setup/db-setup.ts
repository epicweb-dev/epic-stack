import path from 'node:path'
import fsExtra from 'fs-extra'
import { afterAll, beforeEach } from 'vitest'
import { BASE_DATABASE_PATH } from './global-setup.ts'

const databaseFile = `./tests/drizzle/data.${process.env.VITEST_POOL_ID || 0}.db`
const databasePath = path.join(process.cwd(), databaseFile)
process.env.TURSO_DATABASE_URL = `file:${databasePath}`

beforeEach(async () => {
	await fsExtra.copyFile(BASE_DATABASE_PATH, databasePath)
})

afterAll(async () => {
	// we *must* use dynamic imports here so the process.env.DATABASE_URL is set
	// before prisma is imported and initialized
	const { drizzle } = await import('#app/utils/db.server.ts')
	drizzle.$client.close()
	await fsExtra.remove(databasePath)
})
