export default {
	include: ['./app/**/*.test.{ts,tsx}'],
	setupFiles: ['./tests/setup/setup-test-env.ts'],
	globalSetup: ['./tests/setup/global-setup.ts'],
	coverage: {
		include: ['app/**/*.{ts,tsx}'],
		all: true,
	},
}
