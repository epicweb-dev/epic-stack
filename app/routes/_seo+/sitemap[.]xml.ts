import { generateSitemap } from '@nasa-gcn/remix-seo'
import { routes } from '@remix-run/dev/server-build'
import { type LoaderFunctionArgs } from '@remix-run/node'

export function loader({ request }: LoaderFunctionArgs) {
	return generateSitemap(request, routes, {
		siteUrl: new URL(request.url).origin,
		headers: {
			'Cache-Control': `public, max-age=${60 * 5}`,
		},
	})
}
