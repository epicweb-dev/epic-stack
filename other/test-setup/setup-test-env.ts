import './setup-env-vars.ts'
import { afterAll, afterEach, expect } from 'vitest'
import { installGlobals } from '@remix-run/node'
import { matchers } from './matchers.cjs'
import 'dotenv/config'
import fs from 'fs'
import { BASE_DATABASE_PATH, DATABASE_PATH } from './paths.ts'
import { deleteAllData } from './utils.ts'
import { prisma } from '~/utils/db.server.ts'

expect.extend(matchers)

installGlobals()
fs.copyFileSync(BASE_DATABASE_PATH, DATABASE_PATH)

afterEach(() => deleteAllData())

afterAll(async () => {
	await prisma.$disconnect()
	await fs.promises.rm(DATABASE_PATH)
})
