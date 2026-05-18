export function isValidSqliteDatabaseUrl(databaseUrl: unknown): boolean

export function getSetupEnvironment(options?: {
	cwd?: string
	parentEnv?: NodeJS.ProcessEnv
}): {
	envPath: string
	envFile: Record<string, string>
	setupEnv: NodeJS.ProcessEnv
}

export function runSetup(options?: {
	cwd?: string
	parentEnv?: NodeJS.ProcessEnv
}): void
