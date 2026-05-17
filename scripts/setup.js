import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SQLITE_DATABASE_URL_PREFIX = 'file:'

export function isValidSqliteDatabaseUrl(databaseUrl) {
	return (
		typeof databaseUrl === 'string' &&
		databaseUrl.startsWith(SQLITE_DATABASE_URL_PREFIX)
	)
}

function parseEnvFile(envContents) {
	return Object.fromEntries(
		envContents
			.split(/\r?\n/u)
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#'))
			.map((line) => {
				const separatorIndex = line.indexOf('=')
				if (separatorIndex === -1) return [line, '']
				const key = line.slice(0, separatorIndex).trim()
				const rawValue = line.slice(separatorIndex + 1).trim()
				const value = rawValue.replace(/^(['"])(.*)\1$/u, '$2')
				return [key, value]
			}),
	)
}

function getEnvFile(cwd = process.cwd()) {
	const envPath = path.join(cwd, '.env')
	if (!fs.existsSync(envPath)) {
		throw new Error(
			`Missing ${path.relative(cwd, envPath)}. Copy .env.example to .env before running setup.`,
		)
	}

	const envFile = parseEnvFile(fs.readFileSync(envPath, 'utf8'))
	return { envPath, envFile }
}

export function getSetupEnvironment({
	cwd = process.cwd(),
	parentEnv = process.env,
} = {}) {
	const { envPath, envFile } = getEnvFile(cwd)
	const databaseUrl = envFile.DATABASE_URL

	if (!databaseUrl) {
		throw new Error(
			`Missing DATABASE_URL in ${path.relative(cwd, envPath)}. Prisma requires a SQLite file: URL for this project.`,
		)
	}

	if (!isValidSqliteDatabaseUrl(databaseUrl)) {
		throw new Error(
			[
				`Invalid DATABASE_URL in ${path.relative(cwd, envPath)}: ${databaseUrl}`,
				'Prisma requires SQLite URLs in this project to start with "file:".',
				'DATABASE_PATH is a filesystem path used by LiteFS/sqlite3, not a Prisma connection URL.',
			].join(' '),
		)
	}

	if (parentEnv.DATABASE_URL && parentEnv.DATABASE_URL !== databaseUrl) {
		console.warn(
			`Ignoring inherited DATABASE_URL during setup and using ${path.relative(cwd, envPath)} instead.`,
		)
	}

	return {
		envPath,
		envFile,
		setupEnv: {
			...parentEnv,
			DATABASE_URL: databaseUrl,
		},
	}
}

export function runSetup({
	cwd = process.cwd(),
	parentEnv = process.env,
} = {}) {
	const { setupEnv } = getSetupEnvironment({ cwd, parentEnv })
	const commands = [
		'pnpm exec prisma migrate deploy',
		'pnpm exec prisma generate --sql',
		'pnpm run build',
		'pnpm run test:e2e:install',
	]

	for (const command of commands) {
		console.log(`> ${command}`)
		execSync(command, {
			cwd,
			stdio: 'inherit',
			env: setupEnv,
		})
	}
}

const isMain =
	process.argv[1] != null &&
	path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
	try {
		runSetup()
	} catch (error) {
		console.error(
			'Setup failed. Verify that .env contains a SQLite DATABASE_URL that starts with "file:".',
		)
		throw error
	}
}
