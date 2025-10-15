import { type RouteConfig } from '@react-router/dev/routes'
import { autoRoutes } from 'react-router-auto-routes'

export default autoRoutes({
	ignoredRouteFiles: [
		'.*',
		'**/*.css',
		'**/*.test.{js,jsx,ts,tsx}',
		'**/__*.*',
		// This is for server-side utilities you want to colocate
		// next to your routes without making an additional
		// directory. If you need a route that includes "server" or
		// "client" in the filename, use the escape brackets like:
		// my-route.[server].tsx
		'**/*.server.*',
		'**/*.client.*',
	],
}) satisfies RouteConfig
