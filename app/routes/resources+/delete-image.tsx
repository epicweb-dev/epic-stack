import { json, type DataFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { preprocessFormData } from '~/utils/forms'

export const ROUTE_PATH = '/resources/delete-image'

const DeleteFormSchema = z.object({
	imageId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const result = DeleteFormSchema.safeParse(
		preprocessFormData(formData, DeleteFormSchema),
	)
	if (!result.success) {
		return json({ status: 'error', errors: result.error.issues } as const, {
			status: 400,
		})
	}
	const { imageId } = result.data
	const image = await prisma.image.findFirst({
		select: { fileId: true },
		where: {
			fileId: imageId,
			user: { id: userId },
		},
	})
	if (!image) {
		return json({ status: 'error', errors: ['Image not found'] } as const, {
			status: 404,
		})
	}

	await prisma.image.delete({
		where: { fileId: image.fileId },
	})

	return json({ status: 'success' } as const)
}
