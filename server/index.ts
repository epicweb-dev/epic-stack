import path from 'path'
import { pathToFileURL } from 'url'
import express from 'express'
import chokidar from 'chokidar'
import compression from 'compression'
import morgan from 'morgan'
import address from 'address'
import closeWithGrace from 'close-with-grace'
import { createRequestHandler } from '@remix-run/express'
import { broadcastDevReady } from '@remix-run/node'

const BUILD_DIR = path.join(process.cwd(), 'build', 'index.js')
const BUILD_DIR_FILE_URL = pathToFileURL(BUILD_DIR).href

async function start() {
	const { default: getPort, portNumbers } = await import('get-port')
	const { default: chalk } = await import('chalk')
	const app = express()

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

	app.all(
		'*',
		process.env.NODE_ENV === 'development'
			? async (req, res, next) => {
					return createRequestHandler({
						build: await import(BUILD_DIR_FILE_URL),
						mode: process.env.NODE_ENV,
					})(req, res, next)
			  }
			: createRequestHandler({
					build: await import(BUILD_DIR_FILE_URL),
					mode: process.env.NODE_ENV,
			  }),
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
			notifyRemixDevReady()
		}
	})

	closeWithGrace(async () => {
		await new Promise((resolve, reject) => {
			server.close(e => (e ? reject(e) : resolve('ok')))
		})
	})
}

start()

async function notifyRemixDevReady() {
	const build = await import(`${BUILD_DIR_FILE_URL}?update=${Date.now()}`)
	broadcastDevReady(build)
}

// during dev, we'll keep the build module up to date with the changes
if (process.env.NODE_ENV === 'development') {
	// avoid watching the folder itself, just watch its content
	const watcher = chokidar.watch(
		`${path.dirname(BUILD_DIR).replace(/\\/g, '/')}/**.*`,
		{
			ignored: ['**/**.map'],
		},
	)
	watcher.on('all', notifyRemixDevReady)
}
