import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const PORT = process.env.PORT || '3000'

export default defineConfig({
	globalTeardown: './tests/playwright-teardown.ts',
	testDir: './tests/e2e',
	timeout: 15 * 1000,
	expect: {
		timeout: 5 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		['dot'],
		['html'],
		[
			'monocart-reporter',
			{
				name: 'e2e Test Report',
				outputFile: './playwright-report/monocart/index.html',
				coverage: {
					outputDir: './coverage/e2e',
					reports: ['html', 'lcov', 'raw', 'console-summary'],
					sourceFilter: (sourcePath: string) => {
						return sourcePath.startsWith('app/')
					},
				},
			},
		],
	],
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
		reuseExistingServer: true,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			PORT,
			NODE_ENV: 'test',
			NODE_V8_COVERAGE: './coverage/e2e-node-v8',
		},
	},
})
