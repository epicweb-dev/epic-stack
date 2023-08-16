import { type DataFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const image = await prisma.userImage.findUnique({
		where: { id: params.imageId },
		select: { contentType: true, blob: true },
	})

	invariantResponse(image, 'Not found', { status: 404 })

	return new Response(image.blob, {
		headers: {
			'Content-Type': image.contentType,
			'Content-Length': Buffer.byteLength(image.blob).toString(),
			'Content-Disposition': `inline; filename="${params.imageId}"`,
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
