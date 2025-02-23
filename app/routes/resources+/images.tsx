import { invariantResponse } from '@epic-web/invariant'
import { getImgResponse, ImgSource, Fit, Format } from 'openimg/node'
import { prisma } from '#app/utils/db.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/images'

function isFitValue(fit: string | undefined): fit is Fit | undefined {
	if (fit === undefined) {
		return true
	}
	return ['cover', 'contain'].includes(fit)
}

function isFormatValue(
	format: string | undefined,
): format is Format | undefined {
	if (format === undefined) {
		return true
	}
	return ['webp', 'avif', 'jpg', 'jpeg', 'png'].includes(format)
}

export async function loader({ request, params }: Route.LoaderArgs) {
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
		getImgParams: ({ request }) => {
			const url = new URL(request.url)
			const w = url.searchParams.get('w')
			const width = w ? parseInt(w, 10) : undefined
			const h = url.searchParams.get('h')
			const height = h ? parseInt(h, 10) : undefined

			const fit = url.searchParams.get('fit') || undefined
			invariantResponse(isFitValue(fit), 'Invalid fit', { status: 400 })

			const format = url.searchParams.get('format') || undefined
			invariantResponse(isFormatValue(format), 'Invalid format', {
				status: 400,
			})

			let src = url.searchParams.get('src')
			if (!src) {
				const userImageId = url.searchParams.get('userImageId')
				const noteImageId = url.searchParams.get('noteImageId')
				if (userImageId || noteImageId) {
					src = 'bucket'
				}
			}
			invariantResponse(src, 'Image source not provided', { status: 400 })
			return { src, width, height, fit, format }
		},
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
