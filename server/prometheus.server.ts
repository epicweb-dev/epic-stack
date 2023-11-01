import { remember } from '@epic-web/remember'
import chalk from 'chalk'
import express, { type Express } from 'express'
import getPort, { portNumbers } from 'get-port'
import morgan from 'morgan'
import * as client from 'prom-client'

export const prometheus = remember('prometheus-client', () => {
	// NOTE: if you change anything in this function you'll need to restart
	// the dev server to see your changes.

	const requestCounter = new client.Counter({
		name: 'http_request_count',
		help: 'Number of HTTP requests',
		labelNames: ['method', 'path', 'status'] as const,
	})

	const requestDuration = new client.Histogram({
		name: 'http_request_duration_histogram',
		help: 'Duration of HTTP requests',
		labelNames: ['method', 'path', 'status'] as const,
		buckets: [1, 10, 100, 1000, 5000, 10000, 30000],
	})

	const requestDurationSummary = new client.Summary({
		name: 'http_request_duration_summary',
		help: 'Duration of HTTP requests',
		labelNames: ['method', 'path', 'status'] as const,
	})

	const sqlQueryCounter = new client.Counter({
		name: 'sql_query_count',
		help: 'Number of SQL queries executed',
		labelNames: ['query'] as const,
	})

	const sqlQueryDuration = new client.Histogram({
		name: 'sql_query_duration_histogram',
		help: 'Duration of SQL queries executed',
		labelNames: ['query'] as const,
		buckets: [1, 10, 100, 1000, 5000, 10000, 30000],
	})

	const sqlQueryDurationSummary = new client.Summary({
		name: 'sql_query_duration_summary',
		help: 'Duration of SQL queries executed',
		labelNames: ['query'] as const,
	})

	return {
		client,
		requestCounter,
		requestDuration,
		requestDurationSummary,
		sqlQueryCounter,
		sqlQueryDuration,
		sqlQueryDurationSummary,
	}
})

export const installMetrics = async (remixApp: Express) => {
	if (
		process.env.NODE_ENV === 'production' ||
		process.env.ENABLE_METRICS === 'true'
	) {
		const metricsApp = express()
		metricsApp.use(morgan('tiny'))

		metricsApp.get('/metrics', async (_, res) => {
			const metrics = await prometheus.client.register.metrics()
			res.set('Content-Type', 'text/plain')
			res.send(metrics)
		})

		const desiredMetricsPort = 9091
		const metricsPort = await getPort({
			port: portNumbers(desiredMetricsPort, desiredMetricsPort + 100),
		})
		const metricsServer = metricsApp.listen(metricsPort, () => {
			if (metricsPort !== desiredMetricsPort) {
				console.warn(
					chalk.yellow(
						`⚠️  Metrics port ${desiredMetricsPort} is not available, using ${metricsPort} instead.`,
					),
				)
			}
			console.log(`📈 Metrics server listening on at ${metricsPort}/metrics`)
		})
		//attached app to remix app
		remixApp.use((req, res, next) => {
			const start = Date.now()
			res.on('finish', () => {
				const duration = Date.now() - start
				prometheus.requestCounter.inc({
					method: req.method,
					path: req.path,
					status: res.statusCode.toString(),
				})
				prometheus.requestDuration.observe({ path: req.path }, duration)
				prometheus.requestDurationSummary.observe({ path: req.path }, duration)
			})

			next()
		})
		return async function closeWithGrace() {
			return new Promise((resolve, reject) => {
				metricsServer.close(e => (e ? reject(e) : resolve('ok')))
			})
		}
	}
	return null
}
