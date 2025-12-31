import { default as defaultConfig } from '@epic-web/config/eslint'

/** @type {import("eslint").Linter.Config} */
export default [
	...defaultConfig,
	// add custom config objects here:
	{
		files: ['**/tests/**/*.ts'],
		rules: {
			'react-hooks/rules-of-hooks': 'off',
			'no-restricted-syntax': [
				'error',
				{
					selector: 'Literal[value=/Epic Notes/i]',
					message: 'Replace "Epic Notes" with your configured branding string.',
				},
				{
					selector: 'Literal[value=/Epic Stack/i]',
					message:
						'Replace "Epic Stack" references with your configured branding.',
				},
				{
					selector: 'Literal[value=/epicweb\\.com/i]',
					message: 'Replace epicweb.com references with your domain.',
				},
				{
					selector: 'Literal[value=/epicstack\\.dev/]',
					message: 'Replace epicstack.dev references with your domain.',
				},
				{
					selector: 'Literal[value=/epic-stack/]',
					message: 'Replace epic-stack references with your domain.',
				},
			],
		},
	},
	{
		files: ['eslint.config.js', 'app/utils/branding.ts'],
		rules: {
			'no-restricted-syntax': 'off',
		},
	},
	{
		ignores: ['.react-router/*'],
	},
]
