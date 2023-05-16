import { flatRoutes } from 'remix-flat-routes'

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
	cacheDirectory: './node_modules/.cache/remix',
	ignoredRouteFiles: ['**/*'],
	serverModuleFormat: 'esm',
	serverPlatform: 'node',
	tailwind: true,
	postcss: true,
	future: {
		v2_meta: true,
		v2_errorBoundary: true,
		v2_normalizeFormMethod: true,
		v2_routeConvention: true,
		unstable_dev: true,
	},
	routes: async defineRoutes => {
		return flatRoutes('routes', defineRoutes, {
			ignoredRouteFiles: [
				'.*',
				'**/*.css',
				'**/*.test.{js,jsx,ts,tsx}',
				'**/__*.*',
			],
		})
	},
}
