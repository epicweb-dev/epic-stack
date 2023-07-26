import { parse } from '@conform-to/zod'
import { json, type DataFunctionArgs, redirect } from '@remix-run/node'
import { safeRedirect } from 'remix-utils'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'

export const ROUTE_PATH = '/resources/delete-image'

const DeleteFormSchema = z.object({
	imageId: z.string(),
	redirectTo: z.string().optional(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request, { redirectTo: null })
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: DeleteFormSchema,
		acceptMultipleErrors: () => true,
	})
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	const { imageId, redirectTo } = submission.value
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

	if (redirectTo) {
		return redirect(safeRedirect(redirectTo))
	}

	return json({ status: 'success' } as const)
}
