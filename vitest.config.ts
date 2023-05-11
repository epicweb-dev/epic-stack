/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		include: ['./app/**/*.test.{ts,tsx}'],
		environment: 'jsdom',
		setupFiles: ['./other/test-setup/setup-test-env.ts'],
		globalSetup: ['./other/test-setup/global-setup.ts'],
		coverage: {
			include: ['app/**/*.{ts,tsx}'],
			all: true,
		},
	},
})
