import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const PORT = process.env.PORT || '3000'
const envDefaults = {
	LITEFS_DIR: '/litefs/data',
	DATABASE_PATH: './prisma/data.db',
	DATABASE_URL: 'file:./data.db?connection_limit=1',
	CACHE_DATABASE_PATH: './other/cache.db',
	SESSION_SECRET: 'super-duper-s3cret',
	INTERNAL_COMMAND_TOKEN: 'some-made-up-token',
	HONEYPOT_SECRET: 'super-duper-s3cret',
	GITHUB_CLIENT_ID: 'MOCK_GITHUB_CLIENT_ID',
	GITHUB_CLIENT_SECRET: 'MOCK_GITHUB_CLIENT_SECRET',
	GITHUB_TOKEN: 'MOCK_GITHUB_TOKEN',
	GITHUB_REDIRECT_URI: 'https://example.com/auth/github/callback',
	ALLOW_INDEXING: 'true',
	AWS_ACCESS_KEY_ID: 'mock-access-key',
	AWS_SECRET_ACCESS_KEY: 'mock-secret-key',
	AWS_REGION: 'auto',
	AWS_ENDPOINT_URL_S3: 'https://fly.storage.tigris.dev',
	BUCKET_NAME: 'mock-bucket',
} as const

for (const [key, value] of Object.entries(envDefaults)) {
	if (!process.env[key]) {
		process.env[key] = value
	}
}

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 15 * 1000,
	expect: {
		timeout: 5 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: `http://localhost:${PORT}/`,
		trace: 'on-first-retry',
	},

	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
			},
		},
	],

	webServer: {
		command: process.env.CI ? 'npm run start:mocks' : 'npm run dev',
		port: Number(PORT),
		timeout: 60 * 1000,
		reuseExistingServer: true,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			PORT,
			NODE_ENV: 'test',
			...envDefaults,
		},
	},
})
