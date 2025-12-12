import { type Config } from '@react-router/dev/config'
import { sentryOnBuildEnd } from '@sentry/react-router'
import { ENV } from 'varlock/env'

export default {
	// Defaults to true. Set to false to enable SPA for all routes.
	ssr: true,

	routeDiscovery: { mode: 'initial' },

	future: {
		unstable_optimizeDeps: true,
	},

	buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
		if (ENV.MODE === 'production' && ENV.SENTRY_AUTH_TOKEN) {
			await sentryOnBuildEnd({
				viteConfig,
				reactRouterConfig,
				buildManifest,
			})
		}
	},
} satisfies Config
