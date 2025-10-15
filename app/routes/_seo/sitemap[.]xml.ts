import { generateSitemap } from '@nasa-gcn/remix-seo'
import { type ServerBuild } from 'react-router'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { type Route } from './+types/sitemap[.]xml.ts'

export async function loader({ request, context }: Route.LoaderArgs) {
	const serverBuild = (await context.serverBuild) as { build: ServerBuild }

	// TODO: This is typeerror is coming up since of the remix-run/server-runtime package. We might need to remove/update that one.
	// @ts-expect-error
	return generateSitemap(request, serverBuild.build.routes, {
		siteUrl: getDomainUrl(request),
		headers: {
			'Cache-Control': `public, max-age=${60 * 5}`,
		},
	})
}
