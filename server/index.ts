import path from 'path'
import { fileURLToPath } from 'url'
import chokidar from 'chokidar'
import address from 'address'
import Fastify from 'fastify'
import { remixFastifyPlugin } from '@mcansh/remix-fastify'
import { type ServerBuild, broadcastDevReady } from '@remix-run/node'
import fastifyStatic from '@fastify/static'
import helmet from '@fastify/helmet'
import fastifyUrlData from '@fastify/url-data'
import crypto from 'crypto'
import getPort, { portNumbers } from 'get-port'
import chalk from 'chalk'
import * as remixBuild from '../build/index.js'

const MODE = process.env.NODE_ENV

const BUILD_PATH = '../build/index.js'
const dirname = path.dirname(fileURLToPath(import.meta.url))

const build = remixBuild as unknown as ServerBuild
let devBuild = build

const fastify = Fastify({
	// logger: true,
	ignoreTrailingSlash: true,
	ignoreDuplicateSlashes: true,
})

await fastify.register(import('@fastify/compress'))
fastify.register(fastifyUrlData)

const getHost = (req: any) =>
	req.headers['X-Forwarded-Host'] ?? req.hostname ?? ''

fastify.addHook('onRequest', async (req, reply) => {
	const proto = req.headers['X-Forwarded-Proto']
	const host = getHost(req)
	if (proto === 'http') {
		reply.header('X-Forwarded-Proto', 'https')
		await reply.redirect(301, `https://${host}${req.originalUrl}`)
	}
})

fastify.addHook('onRequest', async (req, reply) => {
	const urlData = req.urlData()
	const { path, query } = urlData
	if (path.endsWith('/') && path.length > 1) {
		const safepath = path.slice(0, -1).replace(/\/+/g, '/')
		await reply.redirect(301, `${safepath}?${query}`)
	}
})

const cspNonce = crypto.randomBytes(16).toString('hex')

fastify.register(helmet, {
	crossOriginEmbedderPolicy: false,
	enableCSPNonces: true,
	contentSecurityPolicy: {
		// NOTE: Remove reportOnly when you're ready to enforce this CSP
		reportOnly: true,
		directives: {
			'connect-src': [
				MODE === 'development' ? 'ws:' : null,
				process.env.SENTRY_DSN ? '*.ingest.sentry.io' : null,
				"'self'",
			].filter(Boolean),
			'font-src': ["'self'"],
			'frame-src': ["'self'"],
			'img-src': ["'self'", 'data:'],
			'script-src': [
				"'strict-dynamic'",
				"'self'",
				// @ts-expect-error
				(_, res) => (res.scriptNonce	= cspNonce),
			],
			'script-src-attr': [
				(_, res) => `'nonce-${cspNonce}'`,
			],
			'upgrade-insecure-requests': null,
		},
	},
})

await fastify.register(remixFastifyPlugin, {
	build,
	mode: MODE,
	getLoadContext: () => ({}),
	rootDir: dirname,
	purgeRequireCacheInDevelopment: false,
	unstable_earlyHints: true
})

fastify.register(fastifyStatic, {
	root: path.join(dirname, '../public/build'),
	prefix: '/build',
	decorateReply: false
})

fastify.register(fastifyStatic, {
	root: path.join(dirname, '../public/fonts'),
	prefix: '/fonts',
	decorateReply: false
})

fastify.register(fastifyStatic, {
	root: path.join(dirname, '../public'),
	prefix: '/public',
	decorateReply: false
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
		const portUsed =
			desiredPort === portToUse
				? desiredPort
				: actualPort

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

		if (MODE === 'development') {
			broadcastDevReady(build)
		}

	} catch (err) {
		console.log(err)
		fastify.log.error(err)
		process.exit(1)
	}
}
start()

if (MODE === 'development') {
	async function reloadBuild() {
		devBuild = await import(`${BUILD_PATH}?update=${Date.now()}`)
		broadcastDevReady(devBuild)
	}

	const dirname = path.dirname(fileURLToPath(import.meta.url))
	const watchPath = path.join(dirname, BUILD_PATH).replace(/\\/g, '/')
	const watcher = chokidar.watch(watchPath, { ignoreInitial: true })
	watcher.on('all', reloadBuild)
	watcher.on('all', reloadBuild)
}
