import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import {
	Button,
	Field,
	TextareaField,
	getFieldsFromSchema,
	preprocessFormData,
	useForm,
} from '~/utils/forms.tsx'

export const NoteEditorSchema = z.object({
	id: z.string().optional(),
	title: z.string().nonempty(),
	content: z.string().nonempty(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const result = NoteEditorSchema.safeParse(
		preprocessFormData(formData, NoteEditorSchema),
	)
	if (!result.success) {
		return json({ status: 'error', errors: result.error.flatten() } as const, {
			status: 400,
		})
	}
	let note: { id: string; owner: { username: string } }

	const data = {
		ownerId: userId,
		title: result.data.title,
		content: result.data.content,
	}

	const select = {
		id: true,
		owner: {
			select: {
				username: true,
			},
		},
	}
	if (result.data.id) {
		const existingNote = await prisma.note.findFirst({
			where: { id: result.data.id, ownerId: userId },
			select: { id: true },
		})
		if (!existingNote) {
			return json(
				{
					status: 'error',
					errors: { formErrors: ['Note not found'] },
				} as const,
				{ status: 404 },
			)
		}
		note = await prisma.note.update({
			where: { id: result.data.id },
			data,
			select,
		})
	} else {
		note = await prisma.note.create({ data, select })
	}
	return redirect(`/users/${note.owner.username}/notes/${note.id}`)
}

export function NoteEditor({
	note,
}: {
	note?: { id: string; title: string; content: string }
}) {
	const noteEditorFetcher = useFetcher<typeof action>()

	const { form, fields } = useForm({
		name: 'note-editor',
		errors: {
			...noteEditorFetcher.data?.errors,
			formErrors: noteEditorFetcher.data?.errors?.formErrors,
		},
		fieldMetadatas: getFieldsFromSchema(NoteEditorSchema),
	})

	return (
		<noteEditorFetcher.Form
			method="post"
			action="/resources/note-editor"
			{...form.props}
		>
			<input name="id" type="hidden" value={note?.id} />
			<Field
				labelProps={{ ...fields.title.labelProps, children: 'Title' }}
				inputProps={{
					...fields.title.props,
					autoComplete: 'title',
					defaultValue: note?.title,
				}}
				errors={fields.title.errors}
			/>
			<TextareaField
				labelProps={{ ...fields.content.labelProps, children: 'Content' }}
				textareaProps={{
					...fields.content.props,
					autoComplete: 'content',
					defaultValue: note?.content,
				}}
				errors={fields.content.errors}
			/>
			{form.errorUI}
			<div className="flex justify-end gap-4">
				<Button size="md" variant="secondary" type="reset">
					Reset
				</Button>
				<Button
					size="md"
					variant="primary"
					status={
						noteEditorFetcher.state === 'submitting'
							? 'pending'
							: noteEditorFetcher.data?.status ?? 'idle'
					}
					type="submit"
					disabled={noteEditorFetcher.state !== 'idle'}
				>
					Submit
				</Button>
			</div>
		</noteEditorFetcher.Form>
	)
}
