import { invariantResponse } from '@epic-web/invariant'
import { prisma } from '#app/utils/db.server.ts'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/note-images.$imageId.ts'

export async function loader({ params }: Route.LoaderArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const noteImage = await prisma.noteImage.findUnique({
		where: { id: params.imageId },
		select: { storageKey: true },
	})
	invariantResponse(noteImage, 'Note image not found', { status: 404 })

	const { url, headers } = getSignedGetRequestInfo(noteImage.storageKey)
	return fetch(url, { headers })
}
