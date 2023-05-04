import { devices, type PlaywrightTestConfig } from '@playwright/test'
import 'dotenv/config'

const PORT = process.env.PORT || '3000'

export default {
	testDir: './tests/e2e',
	timeout: 30 * 1000,
	expect: {
		timeout: 10 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		actionTimeout: 0,
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
		command: process.env.CI
			? `cross-env PORT=${PORT} npm run start:mocks`
			: `cross-env PORT=${PORT} npm run dev`,
		port: Number(PORT),
		reuseExistingServer: true,
	},
} satisfies PlaywrightTestConfig
