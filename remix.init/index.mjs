import { execSync } from 'child_process'
import parseGitHubURL from 'parse-github-url'
import crypto from 'crypto'
import { $ } from 'execa'
import fs from 'fs/promises'
import inquirer from 'inquirer'
import path from 'path'
import toml from 'toml'

const escapeRegExp = string =>
	// $& means the whole matched string
	string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getRandomString = length => crypto.randomBytes(length).toString('hex')
const getRandomString16 = () => getRandomString(16)

export default async function main({ isTypeScript, rootDirectory }) {
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

	await setupDeployment({ rootDirectory }).catch(error => {
		console.error(error)

		console.error(
			`Looks like something went wrong setting up deployment. Sorry about that. Check the docs for instructions on how to get deployment setup yourself (https://github.com/epicweb-dev/epic-stack/blob/main/docs/deployment.md).`,
		)
	})

	console.log(
		`
Setup is complete. You're now ready to rock and roll 🐨

What's next?

- Start development with \`npm run dev\`
- Run tests with \`npm run test\` and \`npm run test:e2e\`
		`.trim(),
	)
}

async function setupDeployment({ rootDirectory }) {
	const $I = $({ stdio: 'inherit', cwd: rootDirectory })

	const { shouldSetupDeployment } = await inquirer.prompt([
		{
			name: 'shouldSetupDeployment',
			type: 'confirm',
			default: true,
			message: 'Would you like to setup deployment right now?',
		},
	])

	if (!shouldSetupDeployment) {
		console.log(
			`Ok, check the docs (https://github.com/epicweb-dev/epic-stack/blob/main/docs/deployment.md) when you're ready to set that up.`,
		)
		return
	}

	const hasFly = await $`fly version`.then(
		() => true,
		() => false,
	)
	if (!hasFly) {
		console.log(
			`You need to install Fly first. Follow the instructions here: https://fly.io/docs/hands-on/install-flyctl/`,
		)
		return
	}
	const loggedInUser = await ensureLoggedIn()
	if (!loggedInUser) {
		console.log(
			`Ok, check the docs when you're ready to get this deployed: https://github.com/epicweb-dev/epic-stack/blob/main/docs/deployment.md`,
		)
	}

	const flyConfig = toml.parse(
		await fs.readFile(path.join(rootDirectory, 'fly.toml')),
	)
	const { app: APP_NAME, primary_region: PRIMARY_REGION } = flyConfig

	console.log(`🥪 Creating app ${APP_NAME} and ${APP_NAME}-staging...`)
	await $I`fly apps create ${APP_NAME}-staging`
	await $I`fly apps create ${APP_NAME}`

	console.log(`🤫 Setting secrets in apps`)
	await $I`fly secrets set SESSION_SECRET=${getRandomString16()} ENCRYPTION_SECRET=${getRandomString16()} INTERNAL_COMMAND_TOKEN=${getRandomString16()} --app ${APP_NAME}-staging`
	await $I`fly secrets set SESSION_SECRET=${getRandomString16()} ENCRYPTION_SECRET=${getRandomString16()} INTERNAL_COMMAND_TOKEN=${getRandomString16()} --app ${APP_NAME}`

	console.log(`🔊 Creating volumes`)
	await $I`fly volumes create data --region ${PRIMARY_REGION} --size 1 --app ${APP_NAME}-staging`
	await $I`fly volumes create data --region ${PRIMARY_REGION} --size 1 --app ${APP_NAME}`

	// attach consul
	console.log(`🔗 Attaching consul`)
	await $I`fly consul attach --app ${APP_NAME}-staging`
	await $I`fly consul attach --app ${APP_NAME}`

	const { shouldDeploy } = await inquirer.prompt([
		{
			name: 'shouldDeploy',
			type: 'confirm',
			default: true,
			message: 'Would you like to deploy right now?',
		},
	])
	if (shouldDeploy) {
		console.log(`🚀 Deploying apps...`)
		console.log(`  Starting with staging`)
		await $I`fly deploy --app ${APP_NAME}-staging`
		await $I`fly open --app ${APP_NAME}-staging`

		console.log(`  Staging deployed... Deploying production...`)
		await $I`fly deploy --app ${APP_NAME}`
		await $I`fly open --app ${APP_NAME}`
		console.log(`  Production deployed...`)
	}

	const { shouldSetupGitHub } = await inquirer.prompt([
		{
			name: 'shouldSetupGitHub',
			type: 'confirm',
			default: true,
			message: 'Would you like to setup GitHub Action deployment right now?',
		},
	])
	if (shouldSetupGitHub) {
		console.log(`⛓ Initializing git repo...`)
		await $I`git init`

		console.log(
			`Opening repo.new. Please create a new repo and paste the URL below.`,
		)
		await $I`open https://repo.new`

		const { repoURL } = await inquirer.prompt([
			{
				name: 'repoURL',
				type: 'input',
				message: 'What is the URL of your repo?',
			},
		])

		const githubParts = parseGitHubURL(repoURL)

		if (!githubParts) {
			throw new Error(`Invalid GitHub URL: ${repoURL}`)
		}

		console.log(`🔗 Adding remote...`)
		await $I`git remote add origin git@github.com:${githubParts.owner}/${githubParts.repo}.git`

		console.log(
			`Opening Fly Tokens Dashboard and GitHub Action Secrets pages. Please create a new token on Fly and set it as the value for a new secret called FLY_API_TOKEN on GitHub.`,
		)
		await $I`open https://web.fly.io/user/personal_access_tokens/new`
		await $I`open ${repoURL}/settings/secrets/actions/new`

		const { commitAndPush } = await inquirer.prompt([
			{
				name: 'commitAndPush',
				type: 'confirm',
				default: true,
				message: 'Would you like to commit and push your changes?',
			},
		])
		if (commitAndPush) {
			console.log(`📦 Committing and pushing...`)
			await $I`git add -A`
			await $I`git commit -m "Initial commit"`
			await $I`git push -u origin main`
		}
	}
	console.log('All done 🎉 Happy building')
}

async function ensureLoggedIn() {
	const loggedInUser = await $`fly auth whoami`.then(
		({ stdout }) => stdout,
		() => null,
	)
	if (loggedInUser) {
		const answers = await inquirer.prompt([
			{
				name: 'proceed',
				type: 'list',
				default: 'Yes',
				message: `You're logged in as ${loggedInUser}. Proceed?`,
				choices: ['Yes', 'Login as another user', 'Exit'],
			},
		])
		switch (answers.proceed) {
			case 'Yes': {
				return loggedInUser
			}
			case 'Login as another user': {
				await $`fly auth logout`
				return ensureLoggedIn()
			}
			default: {
				return null
			}
		}
	} else {
		console.log(`You need to login to Fly first. Running \`fly auth login\`...`)
		await $({ stdio: 'inherit' })`fly auth login`
		return ensureLoggedIn()
	}
}
