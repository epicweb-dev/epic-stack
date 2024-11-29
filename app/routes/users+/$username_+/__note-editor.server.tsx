import { parseWithZod } from '@conform-to/zod'
import { invariant } from '@epic-web/invariant'
import { createId } from '@paralleldrive/cuid2'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	redirect,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { and, eq, notInArray } from 'drizzle-orm'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { drizzle } from '#app/utils/db.server.ts'
import { Note, NoteImage } from '#drizzle/schema'
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

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)

	const submission = await parseWithZod(formData, {
		schema: NoteEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const note = await drizzle.query.Note.findFirst({
				columns: { id: true },
				where: and(eq(Note.id, data.id ?? ''), eq(Note.ownerId, userId)),
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
		return json(
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

	const updatedNote = await drizzle.transaction(async (tx) => {
		// Insert/update the note
		const [note] = await tx
			.insert(Note)
			.values({
				id: noteId ?? createId(),
				ownerId: userId,
				title,
				content,
			})
			.onConflictDoUpdate({
				target: Note.id,
				set: {
					title,
					content,
				},
			})
			.returning({
				id: Note.id,
				ownerId: Note.ownerId,
			})
		invariant(note, 'failed to insert/update note')

		// Handle image updates and deletions
		// Delete images not in the updates list
		await tx.delete(NoteImage).where(
			and(
				eq(NoteImage.noteId, note.id),
				notInArray(
					NoteImage.id,
					imageUpdates.map((i) => i.id),
				),
			),
		)

		// Update existing images
		for (const update of imageUpdates) {
			await tx
				.update(NoteImage)
				.set({
					id: update.blob ? createId() : update.id,
					noteId: note.id,
					altText: update.altText,
					...(update.blob
						? {
								contentType: update.contentType,
								blob: update.blob,
							}
						: {}),
				})
				.where(eq(NoteImage.id, update.id))
		}

		// Insert new images
		if (newImages.length) {
			await tx.insert(NoteImage).values(
				newImages.map((image) => ({
					id: createId(),
					noteId: note.id,
					altText: image.altText,
					contentType: image.contentType,
					blob: image.blob,
				})),
			)
		}

		return tx.query.Note.findFirst({
			columns: { id: true },
			with: { owner: { columns: { username: true } } },
			where: eq(Note.id, note.id),
		})
	})

	invariant(updatedNote, 'failed to insert/update note')

	return redirect(
		`/users/${updatedNote.owner.username}/notes/${updatedNote.id}`,
	)
}
