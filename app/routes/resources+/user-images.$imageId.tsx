import { invariantResponse } from '@epic-web/invariant'
import { prisma } from '#app/utils/db.server.ts'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/user-images.$imageId.ts'

export async function loader({ params }: Route.LoaderArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const userImage = await prisma.userImage.findUnique({
		where: { id: params.imageId },
		select: { storageKey: true },
	})
	invariantResponse(userImage, 'User image not found', { status: 404 })
	const { url, headers } = getSignedGetRequestInfo(userImage.storageKey)
	return fetch(url, { headers })
}
