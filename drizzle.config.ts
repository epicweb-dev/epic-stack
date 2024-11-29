import { config } from 'dotenv'
import { type Config } from 'drizzle-kit'

config()

export default {
	schema: './drizzle/schema.ts',
	out: './drizzle/migrations/',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
} satisfies Config
