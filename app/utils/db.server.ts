import { remember } from '@epic-web/remember'
import { PrismaClient, type Prisma } from '@prisma/client'
import chalk from 'chalk'
import { prometheus } from '#server/prometheus.server.ts'

export const prisma = remember('prisma', () => {
	// NOTE: if you change anything in this function you'll need to restart
	// the dev server to see your changes.

	// Feel free to change this log threshold to something that makes sense for you
	const logThreshold = 20

	const client = new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'stdout' },
			{ level: 'warn', emit: 'stdout' },
		],
	})
	client.$on('query', async e => {
		recordMetrics(e)
		if (e.duration < logThreshold) return
		const color =
			e.duration < logThreshold * 1.1
				? 'green'
				: e.duration < logThreshold * 1.2
				? 'blue'
				: e.duration < logThreshold * 1.3
				? 'yellow'
				: e.duration < logThreshold * 1.4
				? 'redBright'
				: 'red'
		const dur = chalk[color](`${e.duration}ms`)
		console.info(`prisma:query - ${dur} - ${e.query}`)
	})
	client.$connect()
	return client
})

const recordMetrics = (e: Prisma.QueryEvent) => {
	prometheus.sqlQueryCounter.inc({ query: e.query })
	prometheus.sqlQueryDuration.observe({ query: e.query }, e.duration)
	prometheus.sqlQueryDurationSummary.observe({ query: e.query }, e.duration)
}
