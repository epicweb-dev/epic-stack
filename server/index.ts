import path from 'path'
import { fileURLToPath } from 'url'
import address from 'address'
import chalk from 'chalk'
import chokidar from 'chokidar'
import Fastify from 'fastify'
import fastifyAutoload from '@fastify/autoload'
import getPort, { portNumbers } from 'get-port'
import { broadcastDevReady } from '@remix-run/node'

const MODE = process.env.NODE_ENV

const BUILD_PATH = '../build/index.js'
const dirname = path.dirname(fileURLToPath(import.meta.url))

const fastify = Fastify({
	// logger: true,
	ignoreTrailingSlash: true,
	ignoreDuplicateSlashes: true,
})

await fastify.register(fastifyAutoload, {
	dir: path.join(dirname, 'plugins'),
	encapsulate: false,
	maxDepth: 0,
	options: {
		dirname,
		buildPath: BUILD_PATH,
		mode: MODE,
	},
})

const desiredPort = Number(process.env.PORT || 3000)
const portToUse = await getPort({
	port: portNumbers(desiredPort, desiredPort + 100),
})

const start = async () => {
	try {
		await fastify.listen({
			port: portToUse,
			host: '0.0.0.0', // all IPv4, see https://fastify.dev/docs/latest/Reference/Server/#listentextresolver
		})
		const { port: actualPort } = fastify.addresses()[0]
		const portUsed = desiredPort === portToUse ? desiredPort : actualPort

		if (portUsed !== desiredPort) {
			console.warn(
				chalk.yellow(
					`⚠️  Port ${desiredPort} is not available, using ${portUsed} instead.`,
				),
			)
		}

		console.log(fastify.server.address())
		console.log(`🚀  We have liftoff!`)
		const localUrl = `http://localhost:${portUsed}`
		let lanUrl: string | null = null
		const localIp = address.ip()
		// Check if the address is a private ip
		// https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
		// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-dev-utils/WebpackDevServerUtils.js#LL48C9-L54C10
		if (/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(localIp)) {
			lanUrl = `http://${localIp}:${portUsed}`
		}

		console.log(
			`
${chalk.bold('Local:')}            ${chalk.cyan(localUrl)}
${lanUrl ? `${chalk.bold('On Your Network:')}  ${chalk.cyan(lanUrl)}` : ''}
${chalk.bold('Press Ctrl+C to stop')}
		`.trim(),
		)
	} catch (err) {
		console.log(err)
		fastify.log.error(err)
		process.exit(1)
	}
}

start()

let devBuild
if (MODE === 'development') {
	async function reloadBuild() {
		devBuild = await import(`${BUILD_PATH}?update=${Date.now()}`)
		broadcastDevReady(devBuild)
	}

	const watchPath = path.join(dirname, BUILD_PATH).replace(/\\/g, '/')
	const watcher = chokidar.watch(watchPath, { ignoreInitial: true })
	watcher.on('all', reloadBuild)
	watcher.on('all', reloadBuild)
}
