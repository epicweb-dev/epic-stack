import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import chokidar from 'chokidar'
import compression from 'compression'
import morgan from 'morgan'
import address from 'address'
import closeWithGrace from 'close-with-grace'
import helmet from 'helmet'
import crypto from 'crypto'
import { createRequestHandler as _createRequestHandler } from '@remix-run/express'
import { wrapExpressCreateRequestHandler } from '@sentry/remix'
import { type ServerBuild, broadcastDevReady } from '@remix-run/node'
import getPort, { portNumbers } from 'get-port'
import chalk from 'chalk'

// @ts-ignore - this file may not exist if you haven't built yet, but it will
// definitely exist by the time the dev or prod server actually runs.
import * as remixBuild from '../build/index.js'
const MODE = process.env.NODE_ENV


const createRequestHandler = wrapExpressCreateRequestHandler(
	_createRequestHandler,
)

const BUILD_PATH = '../build/index.js'

const build = remixBuild as unknown as ServerBuild
let devBuild = build

const app = express()

const getHost = (req: { get: (key: string) => string | undefined }) =>
	req.get('X-Forwarded-Host') ?? req.get('host') ?? ''

// ensure HTTPS only (X-Forwarded-Proto comes from Fly)
app.use((req, res, next) => {
	const proto = req.get('X-Forwarded-Proto')
	const host = getHost(req)
	if (proto === 'http') {
		res.set('X-Forwarded-Proto', 'https')
		res.redirect(`https://${host}${req.originalUrl}`)
		return
	}
	next()
})

// no ending slashes for SEO reasons
// https://github.com/epicweb-dev/epic-stack/discussions/108
app.use((req, res, next) => {
	if (req.path.endsWith('/') && req.path.length > 1) {
		const query = req.url.slice(req.path.length)
		const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
		res.redirect(301, safepath + query)
	} else {
		next()
	}
})

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// Remix fingerprints its assets so we can cache forever.
app.use(
	'/build',
	express.static('public/build', { immutable: true, maxAge: '1y' }),
)
// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }))

morgan.token('url', (req, res) => decodeURIComponent(req.url ?? ''))
app.use(morgan('tiny'))

app.use((_, res, next) => {
	res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
	next()
})

app.use(
	helmet({
		crossOriginEmbedderPolicy: false,
		contentSecurityPolicy: {
			directives: {
				'connect-src': MODE === 'development' ? ['ws:', "'self'"] : null,
				'font-src': ["'self'"],
				'frame-src': ["'self'"],
				'img-src': ["'self'"],
				'script-src': [
					"'strict-dynamic'",
					"'self'",
					// @ts-expect-error
					(_, res) => `'nonce-${res.locals.cspNonce}'`,
				],
				'script-src-attr': [
					// @ts-expect-error
					(_, res) => `'nonce-${res.locals.cspNonce}'`,
				],
				'upgrade-insecure-requests': null,
			},
		},
	}),
)

async function getRequestHandlerOptions(
	build: ServerBuild,
): Promise<Parameters<typeof createRequestHandler>[0]> {
	function getLoadContext(_: any, res: any) {
		return { cspNonce: res.locals.cspNonce }
	}
	return { build, mode: MODE, getLoadContext }
}

app.all(
	'*',
	process.env.NODE_ENV === 'development'
		? async (req, res, next) => {
				return createRequestHandler(await getRequestHandlerOptions(devBuild))(
					req,
					res,
					next,
				)
		  }
		: createRequestHandler(await getRequestHandlerOptions(build)),
)

const desiredPort = Number(process.env.PORT || 3000)
const portToUse = await getPort({
	port: portNumbers(desiredPort, desiredPort + 100),
})

const server = app.listen(portToUse, () => {
	const addy = server.address()
	const portUsed =
		desiredPort === portToUse
			? desiredPort
			: addy && typeof addy === 'object'
			? addy.port
			: 0

	if (portUsed !== desiredPort) {
		console.warn(
			chalk.yellow(
				`⚠️  Port ${desiredPort} is not available, using ${portUsed} instead.`,
			),
		)
	}
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

	if (process.env.NODE_ENV === 'development') {
		broadcastDevReady(build)
	}
})

closeWithGrace(async () => {
	await new Promise((resolve, reject) => {
		server.close(e => (e ? reject(e) : resolve('ok')))
	})
})

// during dev, we'll keep the build module up to date with the changes
if (process.env.NODE_ENV === 'development') {
	async function reloadBuild() {
		devBuild = await import(`${BUILD_PATH}?update=${Date.now()}`)
		broadcastDevReady(devBuild)
	}

	const dirname = path.dirname(fileURLToPath(import.meta.url))
	const watchPath = path.join(dirname, BUILD_PATH).replace(/\\/g, '/')
	const watcher = chokidar.watch(watchPath, { ignoreInitial: true })
	watcher.on('all', reloadBuild)
}
