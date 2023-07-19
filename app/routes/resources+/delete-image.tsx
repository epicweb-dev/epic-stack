import { parse } from '@conform-to/zod'
import { json, type DataFunctionArgs, redirect } from '@remix-run/node'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'

export const ROUTE_PATH = '/resources/delete-image'

const DeleteFormSchema = z.object({
	imageId: z.string(),
	serverOnly: z.string().optional().default('false'),
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
	const { imageId, serverOnly } = submission.value
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

	if (serverOnly === 'true') {
		return redirect('/settings/profile/photo')
	}

	return json({ status: 'success' } as const)
}
