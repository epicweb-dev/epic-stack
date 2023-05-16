import { parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const ROUTE_PATH = '/resources/delete-image'

const DeleteFormSchema = z.object({
	imageId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request, { redirectTo: null })
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: DeleteFormSchema,
		acceptMultipleErrors: () => true,
	})
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	const { imageId } = submission.value
	const image = await prisma.image.findFirst({
		select: { fileId: true },
		where: {
			fileId: imageId,
			user: { id: userId },
		},
	})
	if (!image) {
		submission.error.imageId = ['Image not found']
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 404 },
		)
	}

	await prisma.image.delete({
		where: { fileId: image.fileId },
	})

	return json({ status: 'success' } as const)
}
