import crypto from 'crypto'
import fastifyHelmet from '@fastify/helmet'
import { type FastifyPluginOptions, type FastifyInstance } from 'fastify'

interface PluginOpts extends FastifyPluginOptions {
	mode: 'development' | 'production'
}

async function helmetPlugin(fastify: FastifyInstance, opts: PluginOpts) {
	const { mode } = opts
	const cspNonce = crypto.randomBytes(16).toString('hex')
	await fastify.register(fastifyHelmet, {
		crossOriginEmbedderPolicy: false,
		enableCSPNonces: true,
		contentSecurityPolicy: {
			// NOTE: Remove reportOnly when you're ready to enforce this CSP
			reportOnly: true,
			directives: {
				'connect-src': [
					mode === 'development' ? 'ws:' : null,
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
					(_, res) => (res.scriptNonce = cspNonce),
				],
				'script-src-attr': [(_, res) => `'nonce-${cspNonce}'`],
				'upgrade-insecure-requests': null,
			},
		},
	})
}

export default helmetPlugin
