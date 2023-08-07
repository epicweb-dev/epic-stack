import 'dotenv/config'
import 'source-map-support/register.js'
import './setup-env-vars.ts'

import { installGlobals } from '@remix-run/node'
import fs from 'fs'
import { afterAll, afterEach, expect } from 'vitest'
import { prisma } from '~/utils/db.server.ts'
import { matchers } from './matchers.cjs'
import { BASE_DATABASE_PATH, DATABASE_PATH } from './paths.ts'
import { deleteAllData } from './utils.ts'

expect.extend(matchers)

installGlobals()
fs.copyFileSync(BASE_DATABASE_PATH, DATABASE_PATH)

afterEach(() => deleteAllData())

afterAll(async () => {
	await prisma.$disconnect()
	await fs.promises.rm(DATABASE_PATH)
})
