import { invariantResponse } from '@epic-web/invariant'
import { prisma } from '#app/utils/db.server.ts'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/note-images.$imageId.ts'

export async function loader({ params }: Route.LoaderArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const noteImage = await prisma.noteImage.findUnique({
		where: { id: params.imageId },
		select: { objectKey: true },
	})
	invariantResponse(noteImage, 'Note image not found', { status: 404 })

	const { url, headers } = getSignedGetRequestInfo(noteImage.objectKey)
	const response = await fetch(url, { headers })

	const cacheHeaders = new Headers(response.headers)
	cacheHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')

	return new Response(response.body, {
		status: response.status,
		headers: cacheHeaders,
	})
}
