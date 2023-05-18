import path from 'path'
import { execaCommand } from 'execa'
import fsExtra from 'fs-extra'
import { BASE_DATABASE_PATH, BASE_DATABASE_URL } from './paths.ts'

export async function setup() {
	await fsExtra.ensureDir(path.dirname(BASE_DATABASE_PATH))
	await ensureDbReady()
	return async function teardown() {}
}

async function ensureDbReady() {
	if (!(await fsExtra.pathExists(BASE_DATABASE_PATH))) {
		await execaCommand(
			'prisma migrate reset --force --skip-seed --skip-generate',
			{
				stdio: 'inherit',
				env: {
					...process.env,
					DATABASE_PATH: BASE_DATABASE_PATH,
					DATABASE_URL: BASE_DATABASE_URL,
				},
			},
		)
	}
}
