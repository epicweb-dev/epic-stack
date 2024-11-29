import path from 'node:path'
import { execaCommand } from 'execa'
import fsExtra from 'fs-extra'

export const BASE_DATABASE_PATH = path.join(
	process.cwd(),
	`./tests/drizzle/base.db`,
)

export async function setup() {
	const databaseExists = await fsExtra.pathExists(BASE_DATABASE_PATH)

	if (databaseExists) {
		const databaseLastModifiedAt = (await fsExtra.stat(BASE_DATABASE_PATH))
			.mtime
		const drizzleSchemaLastModifiedAt = (
			await fsExtra.stat('./drizzle/schema.ts')
		).mtime

		if (drizzleSchemaLastModifiedAt < databaseLastModifiedAt) {
			return
		}
	}

	await fsExtra.remove(BASE_DATABASE_PATH)
	await execaCommand(`npm run db:migrate`, {
		stdio: 'inherit',
		env: {
			...process.env,
			TURSO_DATABASE_URL: `file:${BASE_DATABASE_PATH}`,
		},
	})
}
