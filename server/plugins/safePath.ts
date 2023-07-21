import fastifyUrlData from '@fastify/url-data'
import { type FastifyInstance } from 'fastify'

async function safePathPlugin(fastify: FastifyInstance) {
	await fastify.register(fastifyUrlData)

	fastify.addHook('onRequest', async (req, reply) => {
		const urlData = req.urlData()
		const { path, query } = urlData
		if (path?.endsWith('/') && path.length > 1) {
			const safePath = path.slice(0, -1).replace(/\/+/g, '/')
			await reply.redirect(301, `${safePath}?${query}`)
		}
	})
}

export default safePathPlugin
