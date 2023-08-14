import path from 'node:path'
import { execaCommand } from 'execa'
import fsExtra from 'fs-extra'

export const BASE_DATABASE_PATH = path.join(
	process.cwd(),
	`./tests/prisma/base.db`,
)

export async function setup() {
	const databaseExists = await fsExtra.pathExists(BASE_DATABASE_PATH)
	if (databaseExists) return

	await execaCommand('prisma migrate reset --force --skip-generate', {
		stdio: 'inherit',
		env: {
			...process.env,
			MINIMAL_SEED: 'true',
			DATABASE_URL: `file:${BASE_DATABASE_PATH}`,
		},
	})
}
