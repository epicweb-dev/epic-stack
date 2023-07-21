import path from 'path'
import fastifyCompress from '@fastify/compress'
import fastifyStatic from '@fastify/static'
import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'

interface PluginOpts extends FastifyPluginOptions {
	dirname: string
}

async function staticAssetsPlugin(fastify: FastifyInstance, opts: PluginOpts) {
	const { dirname } = opts

	await fastify.register(fastifyCompress)

	await fastify.register(fastifyStatic, {
		root: path.join(dirname, '../public/build'),
		prefix: '/build',
		decorateReply: false,
	})

	await fastify.register(fastifyStatic, {
		root: path.join(dirname, '../public/fonts'),
		prefix: '/fonts',
		decorateReply: false,
	})

	await fastify.register(fastifyStatic, {
		root: path.join(dirname, '../public'),
		prefix: '/public',
		decorateReply: false,
	})
}

export default staticAssetsPlugin
