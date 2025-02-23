import { invariantResponse } from '@epic-web/invariant'
import { getImgResponse, ImgSource } from 'openimg/node'
import { prisma } from '#app/utils/db.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/images.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const domain = getDomainUrl(request)
	const headers = new Headers()
	headers.set('Cache-Control', 'public, max-age=31536000, immutable')
	return getImgResponse(request, {
		headers,
		allowlistedOrigins: [domain, process.env.AWS_ENDPOINT_URL_S3].filter(
			Boolean,
		),
		cacheFolder:
			process.env.NODE_ENV === 'production'
				? '/data/images'
				: './tests/fixtures/openimg',
		getImgSource: ({ params, request }) => {
			if (params.src === 'bucket') {
				const url = new URL(request.url)
				const userImageId = url.searchParams.get('userImageId')
				if (userImageId) {
					return handleUserImage(userImageId)
				}
				const noteImageId = url.searchParams.get('noteImageId')
				if (noteImageId) {
					return handleNoteImage(noteImageId)
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

async function handleUserImage(userImageId: string): Promise<ImgSource> {
	const userImage = await prisma.userImage.findUnique({
		where: { id: userImageId },
		select: { objectKey: true },
	})
	invariantResponse(userImage, 'User image not found', { status: 404 })

	const { url, headers } = getSignedGetRequestInfo(userImage.objectKey)
	return {
		type: 'fetch',
		url,
		headers,
	}
}

async function handleNoteImage(noteImageId: string): Promise<ImgSource> {
	const noteImage = await prisma.noteImage.findUnique({
		where: { id: noteImageId },
		select: { objectKey: true },
	})
	invariantResponse(noteImage, 'Note image not found', { status: 404 })

	const { url, headers } = getSignedGetRequestInfo(noteImage.objectKey)
	return {
		type: 'fetch',
		url,
		headers,
	}
}
