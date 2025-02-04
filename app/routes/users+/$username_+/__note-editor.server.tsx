import { parseWithZod } from '@conform-to/zod'
import { type FileUpload, parseFormData } from '@mjackson/form-data-parser'
import { createId as cuid } from '@paralleldrive/cuid2'
import { data, redirect, type ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { uploadHandler } from '#app/utils/file-uploads.server.ts'
import {
	MAX_UPLOAD_SIZE,
	NoteEditorSchema,
	type ImageFieldset,
} from './__note-editor'

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: NonNullable<ImageFieldset['id']> } {
	return image.id != null
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)

	const formData = await parseFormData(
		request,
		{ maxFileSize: MAX_UPLOAD_SIZE },
		async (file: FileUpload) => uploadHandler(file),
	)

	const submission = await parseWithZod(formData, {
		schema: NoteEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const note = await prisma.note.findUnique({
				select: { id: true },
				where: { id: data.id, ownerId: userId },
			})
			if (!note) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Note not found',
				})
			}
		}).transform(async ({ images = [], ...data }) => {
			return {
				...data,
				imageUpdates: await Promise.all(
					images.filter(imageHasId).map(async (i) => {
						if (imageHasFile(i)) {
							return {
								id: i.id,
								altText: i.altText,
								contentType: i.file.type,
								blob: Buffer.from(await i.file.arrayBuffer()),
							}
						} else {
							return {
								id: i.id,
								altText: i.altText,
							}
						}
					}),
				),
				newImages: await Promise.all(
					images
						.filter(imageHasFile)
						.filter((i) => !i.id)
						.map(async (image) => {
							return {
								altText: image.altText,
								contentType: image.file.type,
								blob: Buffer.from(await image.file.arrayBuffer()),
							}
						}),
				),
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const {
		id: noteId,
		title,
		content,
		imageUpdates = [],
		newImages = [],
	} = submission.value

	const updatedNote = await prisma.note.upsert({
		select: { id: true, owner: { select: { username: true } } },
		where: { id: noteId ?? '__new_note__' },
		create: {
			ownerId: userId,
			title,
			content,
			images: { create: newImages },
		},
		update: {
			title,
			content,
			images: {
				deleteMany: { id: { notIn: imageUpdates.map((i) => i.id) } },
				updateMany: imageUpdates.map((updates) => ({
					where: { id: updates.id },
					data: { ...updates, id: updates.blob ? cuid() : updates.id },
				})),
				create: newImages,
			},
		},
	})

	return redirect(
		`/users/${updatedNote.owner.username}/notes/${updatedNote.id}`,
	)
}
