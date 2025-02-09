import { invariantResponse } from '@epic-web/invariant'
import { prisma } from '#app/utils/db.server.ts'
import { helmet } from '#app/utils/helmet.server.ts'
import { combineHeaders } from '#app/utils/misc.tsx'
import { type Route } from './+types/note-images.$imageId.ts'

export async function loader({ params }: Route.LoaderArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const image = await prisma.noteImage.findUnique({
		where: { id: params.imageId },
		select: { contentType: true, blob: true },
	})

	invariantResponse(image, 'Not found', { status: 404 })

	return new Response(image.blob, {
		headers: combineHeaders(
			{
				'Content-Type': image.contentType,
				'Content-Length': Buffer.byteLength(image.blob).toString(),
				'Content-Disposition': `inline; filename="${params.imageId}"`,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
			helmet(),
		),
	})
}
