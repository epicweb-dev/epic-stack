export default {
	printWidth: 80,
	useTabs: true,
	semi: false,
	singleQuote: true,
	trailingComma: 'all',
	quoteProps: 'as-needed',
	bracketSpacing: true,
	arrowParens: 'always',
	proseWrap: 'always',
	htmlWhitespaceSensitivity: 'css',
	plugins: ['prettier-plugin-tailwindcss', 'prettier-plugin-sql'],
	overrides: [
		{
			files: '**/package.json',
			options: {
				useTabs: false,
			},
		},
		{
			files: '*.mdc',
			options: {
				parser: 'markdown',
			},
		},
	],
}
