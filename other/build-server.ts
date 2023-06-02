import fsExtra from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'
import esbuild from 'esbuild'

const pkg = fsExtra.readJsonSync(path.join(process.cwd(), 'package.json'))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...s: Array<string>) => path.join(__dirname, ...s)
const globsafe = (s: string) => s.replace(/\\/g, '/')

const allFiles = globSync(globsafe(here('../server/**/*.*')), {
	ignore: ['**/tsconfig.json', '**/eslint*', '**/__tests__/**'],
})

const entries = []
for (const file of allFiles) {
	if (/\.(ts|js|tsx|jsx)$/.test(file)) {
		entries.push(file)
	} else {
		const dest = file.replace(here('../server'), here('../server-build'))
		fsExtra.ensureDirSync(path.parse(dest).dir)
		fsExtra.copySync(file, dest)
		console.log(`copied: ${file.replace(`${here('../server')}/`, '')}`)
	}
}

console.log()
console.log('building...')

esbuild
	.build({
		entryPoints: globSync(globsafe(here('../server/**/*.+(ts|js|tsx|jsx)'))),
		outdir: here('../server-build'),
		target: [`node${pkg.engines.node}`],
		platform: 'node',
		format: 'esm',
		logLevel: 'info',
	})
	.catch((error: unknown) => {
		console.error(error)
		process.exit(1)
	})
