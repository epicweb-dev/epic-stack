import { generateSitemap } from '@nasa-gcn/remix-seo'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { type Route } from './+types/sitemap[.]xml.ts'

export async function loader({ request, context }: Route.LoaderArgs) {
	// TODO: This is typeerror is coming up since of the remix-run/server-runtime package. We might need to remove/update that one.
	// @ts-expect-error
	return generateSitemap(request, context.serverBuild.routes, {
		siteUrl: getDomainUrl(request),
		headers: {
			'Cache-Control': `public, max-age=${60 * 5}`,
		},
	})
}
