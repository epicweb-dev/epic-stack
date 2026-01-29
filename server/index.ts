import { styleText } from 'node:util'
import { helmet } from '@nichtsam/helmet/node-http'
import * as Sentry from '@sentry/react-router'
import { ip as ipAddress } from 'address'
import closeWithGrace from 'close-with-grace'
import compression from 'compression'
import express from 'express'
import rateLimit from 'express-rate-limit'
import getPort, { portNumbers } from 'get-port'
import morgan from 'morgan'

const MODE = process.env.NODE_ENV ?? 'development'
const IS_PROD = MODE === 'production'
const IS_DEV = MODE === 'development'
const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== 'false'
const SENTRY_ENABLED = IS_PROD && process.env.SENTRY_DSN
const BUILD_PATH = '../build/server/index.js'

if (SENTRY_ENABLED) {
	void import('./utils/monitoring.ts').then(({ init }) => init())
}

const app = express()

const getHost = (req: { get: (key: string) => string | undefined }) =>
	req.get('X-Forwarded-Host') ?? req.get('host') ?? ''

// fly is our proxy
app.set('trust proxy', true)

// ensure HTTPS only (X-Forwarded-Proto comes from Fly)
app.use((req, res, next) => {
	if (req.method !== 'GET') return next()
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
app.get(/.*/, (req, res, next) => {
	if (req.path.endsWith('/') && req.path.length > 1) {
		const query = req.url.slice(req.path.length)
		const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
		res.redirect(302, safepath + query)
	} else {
		next()
	}
})

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

app.use((_, res, next) => {
	// The referrerPolicy breaks our redirectTo logic
	helmet(res, { general: { referrerPolicy: false } })
	next()
})

app.get([/^\/img\/.*/, /^\/favicons\/.*/], (_req, res) => {
	// if we made it past the express.static for these, then we're missing something.
	// So we'll just send a 404 and won't bother calling other middleware.
	return res.status(404).send('Not found')
})

morgan.token('url', (req) => {
	try {
		return decodeURIComponent(req.url ?? '')
	} catch {
		return req.url ?? ''
	}
})
app.use(
	morgan('tiny', {
		skip: (req, res) =>
			res.statusCode === 200 &&
			(req.url?.startsWith('/resources/images') ||
				req.url?.startsWith('/resources/healthcheck')),
	}),
)

// When running tests or running in development, we want to effectively disable
// rate limiting because playwright tests are very fast and we don't want to
// have to wait for the rate limit to reset between tests.
const maxMultiple =
	!IS_PROD || process.env.PLAYWRIGHT_TEST_BASE_URL ? 10_000 : 1
const rateLimitDefault = {
	windowMs: 60 * 1000,
	limit: 1000 * maxMultiple,
	standardHeaders: true,
	legacyHeaders: false,
	validate: { trustProxy: false },
	// Malicious users can spoof their IP address which means we should not default
	// to trusting req.ip when hosted on Fly.io. However, users cannot spoof Fly-Client-Ip.
	// When sitting behind a CDN such as cloudflare, replace fly-client-ip with the CDN
	// specific header such as cf-connecting-ip
	keyGenerator: (req: express.Request) => {
		return req.get('fly-client-ip') ?? rateLimit.ipKeyGenerator(req)
	},
}

const strongestRateLimit = rateLimit({
	...rateLimitDefault,
	windowMs: 60 * 1000,
	limit: 10 * maxMultiple,
})

const strongRateLimit = rateLimit({
	...rateLimitDefault,
	windowMs: 60 * 1000,
	limit: 100 * maxMultiple,
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
		if (strongPaths.some((p) => req.path.includes(p))) {
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

if (!ALLOW_INDEXING) {
	app.use((_, res, next) => {
		res.set('X-Robots-Tag', 'noindex, nofollow')
		next()
	})
}

if (IS_DEV) {
	console.log('Starting development server')
	const viteDevServer = await import('vite').then((vite) =>
		vite.createServer({
			server: { middlewareMode: true },
			// We tell Vite we are running a custom app instead of
			// the SPA default so it doesn't run HTML middleware
			appType: 'custom',
		}),
	)
	app.use(viteDevServer.middlewares)
	app.use(async (req, res, next) => {
		try {
			const source = await viteDevServer.ssrLoadModule('./server/app.ts')
			return await source.app(req, res, next)
		} catch (error) {
			if (typeof error === 'object' && error instanceof Error) {
				viteDevServer.ssrFixStacktrace(error)
			}
			next(error)
		}
	})
} else {
	console.log('Starting production server')
	// React Router fingerprints its assets so we can cache forever.
	app.use(
		'/assets',
		express.static('build/client/assets', {
			immutable: true,
			maxAge: '1y',
			fallthrough: false,
		}),
	)
	// Everything else (like favicon.ico) is cached for an hour. You may want to be
	// more aggressive with this caching.
	app.use(express.static('build/client', { maxAge: '1h' }))
	app.use(await import(BUILD_PATH).then((mod) => mod.app))
}

const desiredPort = Number(process.env.PORT || 3000)
const portToUse = await getPort({
	port: portNumbers(desiredPort, desiredPort + 100),
})
const portAvailable = desiredPort === portToUse
if (!portAvailable && !IS_DEV) {
	console.log(`⚠️ Port ${desiredPort} is not available.`)
	process.exit(1)
}

const server = app.listen(portToUse, () => {
	if (!portAvailable) {
		console.warn(
			styleText(
				'yellow',
				`⚠️  Port ${desiredPort} is not available, using ${portToUse} instead.`,
			),
		)
	}
	console.log(`🚀  We have liftoff!`)
	const localUrl = `http://localhost:${portToUse}`
	let lanUrl: string | null = null
	const localIp = ipAddress() ?? 'Unknown'
	// Check if the address is a private ip
	// https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
	// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-dev-utils/WebpackDevServerUtils.js#LL48C9-L54C10
	if (/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(localIp)) {
		lanUrl = `http://${localIp}:${portToUse}`
	}

	console.log(
		`
${styleText('bold', 'Local:')}            ${styleText('cyan', localUrl)}
${lanUrl ? `${styleText('bold', 'On Your Network:')}  ${styleText('cyan', lanUrl)}` : ''}
${styleText('bold', 'Press Ctrl+C to stop')}
		`.trim(),
	)
})

closeWithGrace(async ({ err }) => {
	await new Promise((resolve, reject) => {
		server.close((e) => (e ? reject(e) : resolve('ok')))
	})
	if (err) {
		console.error(styleText('red', String(err)))
		console.error(styleText('red', String(err.stack)))
		if (SENTRY_ENABLED) {
			Sentry.captureException(err)
			await Sentry.flush(500)
		}
	}
})
