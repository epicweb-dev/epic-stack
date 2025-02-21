import { invariantResponse } from '@epic-web/invariant'
import { prisma } from '#app/utils/db.server.ts'
import { getSignedGetRequestInfo } from '#app/utils/storage.server.ts'
import { type Route } from './+types/user-images.$imageId.ts'

export async function loader({ params }: Route.LoaderArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const userImage = await prisma.userImage.findUnique({
		where: { id: params.imageId },
		select: { objectKey: true },
	})
	invariantResponse(userImage, 'User image not found', { status: 404 })

	const { url, headers } = getSignedGetRequestInfo(userImage.objectKey)
	const response = await fetch(url, { headers })

	const cacheHeaders = new Headers(response.headers)
	cacheHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')

	return new Response(response.body, {
		status: response.status,
		headers: cacheHeaders,
	})
}
