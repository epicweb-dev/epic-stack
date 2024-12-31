import { generateSitemap } from '@nasa-gcn/remix-seo'
import { type ServerBuild, type LoaderFunctionArgs } from 'react-router'
import { getDomainUrl } from '#app/utils/misc.tsx'

export async function loader({ request, context }: LoaderFunctionArgs) {
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
