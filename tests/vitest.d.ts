import { type TestingLibraryMatchers } from '@testing-library/jest-dom/matchers.js'

declare module 'vitest' {
	interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
	interface AsymmetricMatchersContaining
		extends TestingLibraryMatchers<T, void> {}
}
