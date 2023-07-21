import { type FastifyInstance } from 'fastify'

declare module 'fastify' {
	interface FastifyRequest {
		getHost(this: FastifyRequest): string
	}
}

const X_FORWARDED_PROTO = 'x-forwarded-proto'
const X_FORWARDED_HOST = 'x-forwarded-host'

async function forwardedHostPlugin(fastify: FastifyInstance) {
	fastify.decorateRequest('getHost', function () {
		return (
			(this.headers[X_FORWARDED_HOST] as string | undefined) ??
			this.hostname ??
			''
		)
	})

	fastify.addHook('onRequest', async (req, reply) => {
		const proto = req.headers[X_FORWARDED_PROTO]
		const host = req.getHost()
		if (proto === 'http') {
			reply.header(X_FORWARDED_PROTO, 'https')
			await reply.redirect(301, `https://${host}${req.originalUrl}`)
		}
	})
}

export default forwardedHostPlugin
