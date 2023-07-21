import path from 'path'
import { remixFastifyPlugin } from '@mcansh/remix-fastify'
import { type FastifyPluginOptions, type FastifyInstance } from 'fastify'
import { type ServerBuild } from '@remix-run/node'

interface PluginOpts extends FastifyPluginOptions {
	buildPath: string
	dirname: string
	mode: 'development' | 'production'
}

async function remixPlugin(fastify: FastifyInstance, opts: PluginOpts) {
	const { buildPath, dirname, mode } = opts

	const serverBuildPath = path.join(dirname, buildPath)
	let serverBuild: ServerBuild

	try {
		serverBuild = await import(serverBuildPath)
	} catch (error) {
		throw Error(`No build found at ${serverBuildPath}`)
	}

	await fastify.register(remixFastifyPlugin, instance => ({
		build: serverBuild,
		rootDir: dirname,
		mode,
		purgeRequireCacheInDevelopment: false,
		unstable_earlyHints: true,
		getLoadContext: (request, reply) => ({
			fastify: {
        instance,
        request,
        reply
      },
		}),
	}))

	if (mode === 'development') {
		const { broadcastDevReady } = await import('@remix-run/node')
		fastify.addHook('onReady', () => {
			broadcastDevReady(serverBuild)
		})
	}
}

export default remixPlugin
