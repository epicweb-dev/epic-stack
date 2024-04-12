import path from 'node:path'
import fsExtra from 'fs-extra'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { BASE_DATABASE_PATH } from '#/tests/setup/global-setup.ts'
import { cleanupDb } from '#tests/db-utils.ts'


const databaseFile = `./tests/prisma/data.${process.env.VITEST_POOL_ID || 0}.db`
const databasePath = path.join(process.cwd(), databaseFile)
process.env.DATABASE_URL = `file:${databasePath}`

beforeAll(async () => {
	await fsExtra.copyFile(BASE_DATABASE_PATH, databasePath)
})

// we *must* use dynamic imports here so the process.env.DATABASE_URL is set
// before prisma is imported and initialized
afterEach(async () => {
	const { prisma } = await import('#app/utils/db.server.ts')
	await cleanupDb(prisma)
})

afterAll(async () => {
	const { prisma } = await import('#app/utils/db.server.ts')
	await prisma.$disconnect()
	await fsExtra.remove(databasePath)
})
