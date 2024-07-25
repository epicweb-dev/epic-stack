import { execSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import toml from '@iarna/toml'
import { $ } from 'execa'
import inquirer from 'inquirer'
import open from 'open'
import parseGitHubURL from 'parse-github-url'

const escapeRegExp = (string) =>
	// $& means the whole matched string
	string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getRandomString = (length) => crypto.randomBytes(length).toString('hex')
const getRandomString32 = () => getRandomString(32)

export default async function main({ rootDirectory }) {
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
		.toLowerCase()

	const [flyTomlContent, env, packageJsonString] = await Promise.all([
		fs.readFile(FLY_TOML_PATH, 'utf-8'),
		fs.readFile(EXAMPLE_ENV_PATH, 'utf-8'),
		fs.readFile(PKG_PATH, 'utf-8'),
	])

	const newEnv = env.replace(
		/^SESSION_SECRET=.*$/m,
		`SESSION_SECRET="${getRandomString(16)}"`,
	)

	const newFlyTomlContent = flyTomlContent.replace(
		new RegExp(appNameRegex, 'g'),
		APP_NAME,
	)

	const packageJson = JSON.parse(packageJsonString)

	packageJson.name = APP_NAME
	delete packageJson.author
	delete packageJson.license

	const fileOperationPromises = [
		fs.writeFile(FLY_TOML_PATH, newFlyTomlContent),
		fs.writeFile(ENV_PATH, newEnv),
		fs.writeFile(PKG_PATH, JSON.stringify(packageJson, null, 2)),
		fs.copyFile(
			path.join(rootDirectory, 'remix.init', 'gitignore'),
			path.join(rootDirectory, '.gitignore'),
		),
		fs.rm(path.join(rootDirectory, 'LICENSE.md')),
		fs.rm(path.join(rootDirectory, 'CONTRIBUTING.md')),
		fs.rm(path.join(rootDirectory, 'docs'), { recursive: true }),
		fs.rm(path.join(rootDirectory, 'tests/e2e/notes.test.ts')),
		fs.rm(path.join(rootDirectory, 'tests/e2e/search.test.ts')),
		fs.rm(path.join(rootDirectory, '.github/workflows/version.yml')),
	]

	await Promise.all(fileOperationPromises)

	if (!process.env.SKIP_SETUP) {
		execSync('npm run setup', { cwd: rootDirectory, stdio: 'inherit' })
	}

	if (!process.env.SKIP_FORMAT) {
		execSync('npm run format -- --log-level warn', {
			cwd: rootDirectory,
			stdio: 'inherit',
		})
	}

	if (!process.env.SKIP_DEPLOYMENT) {
		await setupDeployment({ rootDirectory }).catch((error) => {
			console.error(error)

			console.error(
				`Looks like something went wrong setting up deployment. Sorry about that. Check the docs for instructions on how to get deployment setup yourself (https://github.com/epicweb-dev/epic-stack/blob/main/docs/deployment.md).`,
			)
		})
	}

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
			message: 'Would you like to set up deployment right now?',
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

	console.log('🔎 Determining the best region for you...')
	const primaryRegion = await getPreferredRegion()

	const flyConfig = toml.parse(
		await fs.readFile(path.join(rootDirectory, 'fly.toml')),
	)
	flyConfig.primary_region = primaryRegion
	await fs.writeFile(
		path.join(rootDirectory, 'fly.toml'),
		toml.stringify(flyConfig),
	)

	const { app: APP_NAME } = flyConfig

	console.log(`🥪 Creating app ${APP_NAME} and ${APP_NAME}-staging...`)
	await $I`fly apps create ${APP_NAME}-staging`
	await $I`fly apps create ${APP_NAME}`

	console.log(`🤫 Setting secrets in apps`)
	await $I`fly secrets set SESSION_SECRET=${getRandomString32()} INTERNAL_COMMAND_TOKEN=${getRandomString32()} HONEYPOT_SECRET=${getRandomString32()} ALLOW_INDEXING=false --app ${APP_NAME}-staging`
	await $I`fly secrets set SESSION_SECRET=${getRandomString32()} INTERNAL_COMMAND_TOKEN=${getRandomString32()} HONEYPOT_SECRET=${getRandomString32()} --app ${APP_NAME}`

	console.log(
		`🔊 Creating volumes. Answer "yes" when it warns you about downtime. You can add more volumes later (when you actually start getting paying customers �).`,
	)
	await $I`fly volumes create data --region ${primaryRegion} --size 1 --app ${APP_NAME}-staging`
	await $I`fly volumes create data --region ${primaryRegion} --size 1 --app ${APP_NAME}`

	// attach consul
	console.log(`🔗 Attaching consul`)
	await $I`fly consul attach --app ${APP_NAME}-staging`
	await $I`fly consul attach --app ${APP_NAME}`

	const { shouldDeploy } = await inquirer.prompt([
		{
			name: 'shouldDeploy',
			type: 'confirm',
			default: true,
			message:
				'Would you like to deploy right now? (This will take a while, and you can always wait until you push to GitHub instead).',
		},
	])
	if (shouldDeploy) {
		console.log(`🚀 Deploying apps...`)
		console.log('  Moving Dockerfile and .dockerignore to root (temporarily)')
		await fs.rename(
			path.join(rootDirectory, 'other', 'Dockerfile'),
			path.join(rootDirectory, 'Dockerfile'),
		)
		await fs.rename(
			path.join(rootDirectory, 'other', '.dockerignore'),
			path.join(rootDirectory, '.dockerignore'),
		)
		console.log(`  Starting with staging`)
		await $I`fly deploy --app ${APP_NAME}-staging`
		await open(`https://${APP_NAME}-staging.fly.dev/`)

		console.log(`  Staging deployed... Deploying production...`)
		await $I`fly deploy --app ${APP_NAME}`
		await open(`https://${APP_NAME}.fly.dev/`)
		console.log(`  Production deployed...`)
		console.log('  Moving Dockerfile and .dockerignore back to other/')
		await fs.rename(
			path.join(rootDirectory, 'Dockerfile'),
			path.join(rootDirectory, 'other', 'Dockerfile'),
		)
		await fs.rename(
			path.join(rootDirectory, '.dockerignore'),
			path.join(rootDirectory, 'other', '.dockerignore'),
		)
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
		// it's possible there's already a git repo initialized so we'll just ignore
		// any errors and hope things work out.
		await $I`git init`.catch(() => {})

		console.log(
			`Opening repo.new. Please create a new repo and paste the URL below.`,
		)
		await open(`https://repo.new`)

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

		console.log(
			`Opening Fly Tokens Dashboard and GitHub Action Secrets pages. Please create a new token on Fly and set it as the value for a new secret called FLY_API_TOKEN on GitHub.`,
		)
		await open(`https://web.fly.io/user/personal_access_tokens/new`)
		await open(`${repoURL}/settings/secrets/actions/new`)

		console.log(
			`Once you're finished with setting the token, you should be good to add the remote, commit, and push!`,
		)
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

async function getPreferredRegion() {
	const {
		platform: { requestRegion: defaultRegion },
	} = await makeFlyRequest({ query: 'query {platform {requestRegion}}' })

	const availableRegions = await makeFlyRequest({
		query: `{platform {regions {name code}}}`,
	})
	const { preferredRegion } = await inquirer.prompt([
		{
			name: 'preferredRegion',
			type: 'list',
			default: defaultRegion,
			message: `Which region would you like to deploy to? The closest to you is ${defaultRegion}.`,
			choices: availableRegions.platform.regions.map((region) => ({
				name: `${region.name} (${region.code})`,
				value: region.code,
			})),
		},
	])
	return preferredRegion
}

let flyToken = null
async function makeFlyRequest({ query, variables }) {
	if (!flyToken) {
		flyToken = (await $`fly auth token`).stdout.trim()
	}

	const json = await fetch('https://api.fly.io/graphql', {
		method: 'POST',
		body: JSON.stringify({ query, variables }),
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${flyToken}`,
		},
	}).then((response) => response.json())
	return json.data
}
