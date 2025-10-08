import { generateSitemap } from '@nasa-gcn/remix-seo'
import {
	type ServerBuild,
	type RouterContextProvider,
	createContext,
} from 'react-router'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { type Route } from './+types/sitemap[.]xml.ts'
// recreate context key to match the one set in server getLoadContext
export const serverBuildContext = createContext<Promise<{
	error: unknown
	build: ServerBuild
}> | null>(null)

export async function loader({ request, context }: Route.LoaderArgs) {
	const serverBuild = (await (context as Readonly<RouterContextProvider>).get(
		serverBuildContext,
	)) as { build: ServerBuild }

	// TODO: This is typeerror is coming up since of the remix-run/server-runtime package. We might need to remove/update that one.
	// @ts-expect-error
	return generateSitemap(request, serverBuild.build.routes, {
		siteUrl: getDomainUrl(request),
		headers: {
			'Cache-Control': `public, max-age=${60 * 5}`,
		},
	})
}
