import { getImgResponse } from 'openimg/node'
import { type Route } from './+types/images.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'

export async function loader({ request }: Route.LoaderArgs) {
	const domain = getDomainUrl(request)
	const headers = new Headers()
	headers.set('Cache-Control', 'public, max-age=31536000, immutable')
	return getImgResponse(request, {
		headers,
		allowlistedOrigins: [domain, process.env.AWS_ENDPOINT_URL_S3],
		cacheFolder:
			process.env.NODE_ENV === 'production' ? '/data/images' : './data/images',
		getImgSource: ({ params }) => {
			if (params.src.startsWith('/resources')) {
				// Fetch image from resource endpoint
				return {
					type: 'fetch',
					url: domain + params.src,
				}
			}
			if (URL.canParse(params.src)) {
				// Fetch image from external URL; will be matched against allowlist
				return {
					type: 'fetch',
					url: params.src,
				}
			}
			// Retrieve image from filesystem (public folder)
			if (params.src.startsWith('/assets')) {
				// Files managed by Vite
				return {
					type: 'fs',
					path: '.' + params.src,
				}
			}
			// Fallback to files in public folder
			return {
				type: 'fs',
				path: './public' + params.src,
			}
		},
	})
}
