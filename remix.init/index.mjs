import { execSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const escapeRegExp = string =>
	// $& means the whole matched string
	string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getRandomString = length => crypto.randomBytes(length).toString('hex')

const main = async ({ isTypeScript, rootDirectory }) => {
	if (!isTypeScript) {
		// not throwing an error because the stack trace doesn't do anything to help the user
		throw `Sorry, this template only supports TypeScript. Please run the command again and select "TypeScript". Learn more about why in https://github.com/epicweb-dev/epic-stack/blob/main/docs/decisions/001-typescript-only.md`
	}
	const README_PATH = path.join(rootDirectory, 'README.md')
	const FLY_TOML_PATH = path.join(rootDirectory, 'fly.toml')
	const EXAMPLE_ENV_PATH = path.join(rootDirectory, '.env.example')
	const ENV_PATH = path.join(rootDirectory, '.env')
	const PKG_PATH = path.join(rootDirectory, 'package.json')

	const appNameRegex = escapeRegExp('epic-stack-template')

	const DIR_NAME = path.basename(rootDirectory)
	const SUFFIX = getRandomString(2)

	const APP_NAME = (DIR_NAME + '-' + SUFFIX)
		// get rid of anything that's not allowed in an app name
		.replace(/[^a-zA-Z0-9-_]/g, '-')

	const [flyTomlContent, readme, env, packageJson] = await Promise.all([
		fs.readFile(FLY_TOML_PATH, 'utf-8'),
		fs.readFile(README_PATH, 'utf-8'),
		fs.readFile(EXAMPLE_ENV_PATH, 'utf-8'),
		fs.readFile(PKG_PATH, 'utf-8'),
	])

	const newEnv = env
		.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${getRandomString(16)}"`)
		.replace(
			/^ENCRYPTION_SECRET=.*$/m,
			`ENCRYPTION_SECRET="${getRandomString(16)}"`,
		)
		.replace(
			/^INTERNAL_COMMAND_TOKEN=.*$/m,
			`INTERNAL_COMMAND_TOKEN="${getRandomString(16)}"`,
		)

	const newFlyTomlContent = flyTomlContent.replace(
		new RegExp(appNameRegex, 'g'),
		APP_NAME,
	)

	const newReadme = readme.replace(new RegExp(appNameRegex, 'g'), APP_NAME)

	const newPackageJson = packageJson.replace(
		new RegExp(appNameRegex, 'g'),
		APP_NAME,
	)

	const fileOperationPromises = [
		fs.writeFile(FLY_TOML_PATH, newFlyTomlContent),
		fs.writeFile(README_PATH, newReadme),
		fs.writeFile(ENV_PATH, newEnv),
		fs.writeFile(PKG_PATH, newPackageJson),
		fs.copyFile(
			path.join(rootDirectory, 'remix.init', 'gitignore'),
			path.join(rootDirectory, '.gitignore'),
		),
		fs.rm(path.join(rootDirectory, 'LICENSE.md')),
		fs.rm(path.join(rootDirectory, 'CONTRIBUTING.md')),
		fs.rm(path.join(rootDirectory, 'docs'), { recursive: true }),
	]

	await Promise.all(fileOperationPromises)

	execSync('npm run setup', { cwd: rootDirectory, stdio: 'inherit' })

	execSync('npm run format -- --loglevel warn', {
		cwd: rootDirectory,
		stdio: 'inherit',
	})

	console.log(
		`Setup is complete. You're now ready to rock and roll 🐨

Start development with \`npm run dev\`
		`.trim(),
	)
}

export default main
