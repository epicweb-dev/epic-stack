import { spawnSync } from 'node:child_process'

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== '--')
const result = spawnSync(
	'prettier',
	['--write', '.', '--ignore-unknown', ...forwardedArgs],
	{
		stdio: 'inherit',
		shell: process.platform === 'win32',
	},
)

if (result.error) {
	throw result.error
}

process.exit(result.status ?? 1)
