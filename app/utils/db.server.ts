import { remember } from '@epic-web/remember'
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { type Logger } from 'drizzle-orm'
import { drizzle as DrizzleClient } from 'drizzle-orm/libsql'
import * as schema from '../../drizzle/schema'

config()

class DrizzleLogger implements Logger {
	logQuery(query: string) {
		console.log(query)
	}
}

export const drizzle = remember('drizzle', () => {
	// NOTE: if you change anything in this function you'll need to restart
	// the dev server to see your changes.

	const turso = createClient({
		url: process.env.TURSO_DATABASE_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN,
	})

	const client = DrizzleClient(turso, { logger: new DrizzleLogger(), schema })
	return client
})
