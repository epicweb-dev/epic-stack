// we need these to be imported first 👆
import { installGlobals } from '@remix-run/node'
import { cleanup } from '@testing-library/react'
import 'dotenv/config'
import { afterEach, beforeEach, type SpyInstance, vi } from 'vitest'

import '#app/utils/env.server.ts'
import { server } from '#tests/mocks/index.ts'

import '#/tests/setup/custom-matchers.ts'
import '#/tests/setup/db-setup.ts'

installGlobals()

afterEach(() => server.resetHandlers())
afterEach(() => cleanup())

export let consoleError: SpyInstance<Parameters<(typeof console)['error']>>

beforeEach(() => {
	const originalConsoleError = console.error
	consoleError = vi.spyOn(console, 'error')
	consoleError.mockImplementation(
		(...args: Parameters<typeof console.error>) => {
			originalConsoleError(...args)
			throw new Error(
				'Console error was called. Call consoleError.mockImplementation(() => {}) if this is expected.',
			)
		},
	)
})
