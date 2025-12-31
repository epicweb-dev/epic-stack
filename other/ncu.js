#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync, appendFileSync } from 'node:fs'
import path from 'node:path'

const TARGET_OPTIONS = new Set(['latest', 'minor', 'patch'])
const SKIP_UPGRADES = new Set(['vitest'])

function parseArgs() {
	const args = { log: 'ncu.local.log' }
	const raw = process.argv.slice(2)
	for (let i = 0; i < raw.length; i++) {
		const arg = raw[i]
		if (arg === '--target' && raw[i + 1]) {
			args.target = raw[++i]
		} else if (arg === '--log' && raw[i + 1]) {
			args.log = raw[++i]
		} else {
			console.error(`Unknown or malformed argument: ${arg}`)
			process.exit(1)
		}
	}
	if (!args.target || !TARGET_OPTIONS.has(args.target)) {
		console.error(
			`--target is required and must be one of: ${Array.from(
				TARGET_OPTIONS,
			).join(', ')}`,
		)
		process.exit(1)
	}
	return args
}

function log(line, level = 'INFO', file) {
	const entry = `${new Date().toISOString()} - ${level} - ${line}`
	console.log(entry)
	appendFileSync(file, entry + '\n')
}

function runCommand(command) {
	const result = spawnSync(command, {
		shell: true,
		stdio: ['ignore', 'pipe', 'pipe'],
		encoding: 'utf-8',
	})
	return {
		success: result.status === 0,
		output: result.stdout + result.stderr,
	}
}

function requireDependency(dep, logFile) {
	const { success } = runCommand(`which ${dep}`)
	if (!success) {
		log(
			`${dep} is not installed. Please install it and rerun the script.`,
			'ERROR',
			logFile,
		)
		process.exit(1)
	}
}

async function main() {
	const { target, log: logFile } = parseArgs()

	for (const dep of ['node', 'jq', 'git']) {
		requireDependency(dep, logFile)
	}

	if (!existsSync(path.resolve('package.json'))) {
		log('package.json not found in the current directory.', 'ERROR', logFile)
		process.exit(1)
	}

	const baseCommand = `npx -y npm-check-updates --target ${target} --jsonUpgraded`
	log(`Running ${baseCommand}`, 'INFO', logFile)
	let { success, output } = runCommand(baseCommand)
	if (!success) {
		log('npx npm-check-updates failed. Exiting.', 'ERROR', logFile)
		process.exit(1)
	}

	let upgradeList = {}
	try {
		upgradeList = JSON.parse(output)
	} catch {
		log('Unable to parse ncu output as JSON.', 'ERROR', logFile)
		process.exit(1)
	}

	const skippedPackages = []
	for (const [packageName, packageVersion] of Object.entries(upgradeList)) {
		if (SKIP_UPGRADES.has(packageName)) {
			skippedPackages.push([packageName, packageVersion])
			delete upgradeList[packageName]
		}
	}

	const packages = Object.entries(upgradeList)
	if (packages.length === 0) {
		log('No packages to upgrade.', 'INFO', logFile)
		logSkippedPackages(skippedPackages, logFile)
		return
	}

	log(`${packages.length} packages have upgrades.`, 'INFO', logFile)

	let successful = 0
	let failed = 0

	for (let i = 0; i < packages.length; i++) {
		const [packageName, packageVersion] = packages[i]
		log(
			`(${i + 1}/${packages.length}) Upgrading ${packageName}...`,
			'INFO',
			logFile,
		)

		success = runCommand(
			`npx npm-check-updates -u --target ${target} ${packageName}`,
		).success
		if (!success) {
			log(
				`FAILED: npx npm-check-updates -u --target ${target} ${packageName}. Reverting.`,
				'ERROR',
				logFile,
			)
			runCommand('git checkout -- package.json package-lock.json')
			runCommand('npm install')
			failed += 1
			continue
		}

		;({ success, output } = runCommand('npm install'))
		if (!success) {
			log(output, 'ERROR', logFile)
			log(
				`npm install failed after upgrading ${packageName}. Reverting.`,
				'ERROR',
				logFile,
			)
			runCommand('git checkout -- package.json package-lock.json')
			runCommand('npm install')
			failed += 1
			continue
		}

		;({ success, output } = runCommand('npm run validate'))
		if (!success) {
			log(
				`npm run validate failed for ${packageName}. Reverting.`,
				'ERROR',
				logFile,
			)
			log(output, 'ERROR', logFile)
			runCommand('git checkout -- package.json package-lock.json')
			runCommand('npm install')
			failed += 1
			continue
		}

		;({ success } = runCommand('git add package.json package-lock.json'))
		if (!success) {
			log(`git add failed for ${packageName}. Reverting.`, 'ERROR', logFile)
			runCommand('git reset HEAD package.json package-lock.json')
			runCommand('git checkout -- package.json package-lock.json')
			runCommand('npm install')
			failed += 1
			continue
		}

		;({ success, output } = runCommand(
			`git commit -m "upgrade ${packageName} to ${packageVersion}"`,
		))
		if (!success) {
			log(`git commit failed for ${packageName}. Reverting.`, 'ERROR', logFile)
			log(output, 'ERROR', logFile)
			runCommand('git reset HEAD package.json package-lock.json')
			runCommand('git checkout -- package.json package-lock.json')
			runCommand('npm install')
			failed += 1
			continue
		}

		log(`${packageName} successfully upgraded and committed.`, 'INFO', logFile)
		successful += 1
	}

	log(
		`All packages processed. Successful upgrades: ${successful}, Failed upgrades: ${failed}`,
		'INFO',
		logFile,
	)
	logSkippedPackages(skippedPackages, logFile)
}

function logSkippedPackages(skippedPackages, logFile) {
	if (skippedPackages.length === 0) return
	for (const [packageName, packageVersion] of skippedPackages) {
		log(
			`Skipped upgrading ${packageName}. Update available: ${packageVersion}`,
			'WARN',
			logFile,
		)
	}
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
