/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
	extends: [
		'@remix-run/eslint-config',
		'@remix-run/eslint-config/node',
		'@remix-run/eslint-config/jest-testing-library',
		'prettier',
	],
	overrides: [
		{
			files: ['*.test.ts', '*.test.tsx', '*.test.js', '*.test.jsx'],
			rules: {
				'testing-library/prefer-screen-queries': 'off',
				'testing-library/no-await-sync-query': 'off',
			},
		},
	],
	rules: {
		'@typescript-eslint/consistent-type-imports': [
			'warn',
			{
				prefer: 'type-imports',
				disallowTypeAnnotations: true,
				fixStyle: 'inline-type-imports',
			},
		],
		'testing-library/no-await-sync-events': 'off',
		'jest-dom/prefer-in-document': 'off',
		'@typescript-eslint/no-duplicate-imports': 'warn',
	},
	// we're using vitest which has a very similar API to jest
	// (so the linting plugins work nicely), but it means we have to explicitly
	// set the jest version.
	settings: {
		jest: {
			version: 28,
		},
	},
}
