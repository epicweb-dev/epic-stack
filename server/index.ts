import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import {
	createRequestHandler as _createRequestHandler,
	type RequestHandler,
} from '@remix-run/express'
import {
	broadcastDevReady,
	installGlobals,
	type ServerBuild,
} from '@remix-run/node'
import { wrapExpressCreateRequestHandler } from '@sentry/remix'
import address from 'address'
import chalk from 'chalk'
import closeWithGrace from 'close-with-grace'
import compression from 'compression'
import express from 'express'
import rateLimit from 'express-rate-limit'
import getPort, { portNumbers } from 'get-port'
import helmet from 'helmet'
import morgan from 'morgan'

installGlobals()

const MODE = process.env.NODE_ENV

const createRequestHandler = wrapExpressCreateRequestHandler(
	_createRequestHandler,
)

const BUILD_PATH = '../build/index.js'
const WATCH_PATH = '../build/version.txt'

/**
 * Initial build
 * @type {ServerBuild}
 */
const build = await import(BUILD_PATH)
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

// Aggressively cache fonts for a year
app.use(
	'/fonts',
	express.static('public/fonts', { immutable: true, maxAge: '1y' }),
)

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }))

morgan.token('url', (req, res) => decodeURIComponent(req.url ?? ''))
app.use(
	morgan('tiny', {
		skip: (req, res) =>
			res.statusCode === 200 &&
			(req.url?.startsWith('/resources/note-images') ||
				req.url?.startsWith('/resources/user-images') ||
				req.url?.startsWith('/resources/healthcheck')),
	}),
)

app.use((_, res, next) => {
	res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
	next()
})

app.use(
	helmet({
		referrerPolicy: { policy: 'same-origin' },
		crossOriginEmbedderPolicy: false,
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

// When running tests or running in development, we want to effectively disable
// rate limiting because playwright tests are very fast and we don't want to
// have to wait for the rate limit to reset between tests.
const maxMultiple =
	MODE !== 'production' || process.env.PLAYWRIGHT_TEST_BASE_URL ? 10_000 : 1
const rateLimitDefault = {
	windowMs: 60 * 1000,
	max: 1000 * maxMultiple,
	standardHeaders: true,
	legacyHeaders: false,
}

const strongestRateLimit = rateLimit({
	...rateLimitDefault,
	windowMs: 60 * 1000,
	max: 10 * maxMultiple,
})

const strongRateLimit = rateLimit({
	...rateLimitDefault,
	windowMs: 60 * 1000,
	max: 100 * maxMultiple,
})

const generalRateLimit = rateLimit(rateLimitDefault)
app.use((req, res, next) => {
	const strongPaths = [
		'/login',
		'/signup',
		'/verify',
		'/admin',
		'/onboarding',
		'/reset-password',
		'/settings/profile',
		'/resources/login',
		'/resources/verify',
	]
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		if (strongPaths.some(p => req.path.includes(p))) {
			return strongestRateLimit(req, res, next)
		}
		return strongRateLimit(req, res, next)
	}

	// the verify route is a special case because it's a GET route that
	// can have a token in the query string
	if (req.path.includes('/verify')) {
		return strongestRateLimit(req, res, next)
	}

	return generalRateLimit(req, res, next)
})

function getRequestHandler(build: ServerBuild): RequestHandler {
	function getLoadContext(_: any, res: any) {
		return { cspNonce: res.locals.cspNonce }
	}
	return createRequestHandler({ build, mode: MODE, getLoadContext })
}

app.all(
	'*',
	MODE === 'development'
		? (...args) => getRequestHandler(devBuild)(...args)
		: getRequestHandler(build),
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

	if (MODE === 'development') {
		broadcastDevReady(build)
	}
})

closeWithGrace(async () => {
	await new Promise((resolve, reject) => {
		server.close(e => (e ? reject(e) : resolve('ok')))
	})
})

// during dev, we'll keep the build module up to date with the changes
if (MODE === 'development') {
	async function reloadBuild() {
		devBuild = await import(`${BUILD_PATH}?update=${Date.now()}`)
		broadcastDevReady(devBuild)
	}

	// We'll import chokidar here so doesn't get bundled in production.
	const chokidar = await import('chokidar')

	const dirname = path.dirname(fileURLToPath(import.meta.url))
	const watchPath = path.join(dirname, WATCH_PATH).replace(/\\/g, '/')

	chokidar
		.watch(watchPath, { ignoreInitial: true })
		.on('add', reloadBuild)
		.on('change', reloadBuild)
}
