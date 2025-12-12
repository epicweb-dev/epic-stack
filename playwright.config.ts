import 'varlock/auto-load'
import { defineConfig, devices } from '@playwright/test'
import { ENV } from 'varlock/env'

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 15 * 1000,
	expect: {
		timeout: 5 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!ENV.CI,
	retries: ENV.CI ? 2 : 0,
	workers: ENV.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: `http://localhost:${ENV.PORT}/`,
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
		command: ENV.CI ? 'npm run start:mocks' : 'npm run dev',
		port: ENV.PORT,
		reuseExistingServer: true,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			PORT: ENV.PORT.toString(),
			NODE_ENV: 'test',
		},
	},
})
