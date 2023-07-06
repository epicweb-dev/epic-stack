import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '~/components/ui/button.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ErrorList, Field, TextareaField } from '~/components/forms.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'

export const NoteEditorSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1),
	content: z.string().min(1),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: NoteEditorSchema,
		acceptMultipleErrors: () => true,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	let note: { id: string; owner: { username: string } }

	const { title, content, id } = submission.value

	const data = {
		ownerId: userId,
		title: title,
		content: content,
	}

	const select = {
		id: true,
		owner: {
			select: {
				username: true,
			},
		},
	}
	if (id) {
		const existingNote = await prisma.note.findFirst({
			where: { id, ownerId: userId },
			select: { id: true },
		})
		if (!existingNote) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		note = await prisma.note.update({
			where: { id },
			data,
			select,
		})
	} else {
		note = await prisma.note.create({ data, select })
	}
	return redirectWithToast(`/users/${note.owner.username}/notes/${note.id}`, {
		title: id ? 'Note updated' : 'Note created',
	})
}

export function NoteEditor({
	note,
}: {
	note?: { id: string; title: string; content: string }
}) {
	const noteEditorFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'note-editor',
		constraint: getFieldsetConstraint(NoteEditorSchema),
		lastSubmission: noteEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: NoteEditorSchema })
		},
		defaultValue: {
			title: note?.title,
			content: note?.content,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<noteEditorFetcher.Form
			method="post"
			action="/resources/note-editor"
			className="flex gap-y-4 h-full flex-col overflow-x-hidden px-10 py-12"
			{...form.props}
		>
			<input name="id" type="hidden" value={note?.id} />
			<Field
				labelProps={{ children: 'Title' }}
				inputProps={{
					...conform.input(fields.title),
					autoComplete: 'title',
					autoFocus: true,
				}}
				errors={fields.title.errors}
				className="flex flex-col gap-y-2"
			/>
			<TextareaField
				labelProps={{ children: 'Content' }}
				textareaProps={{
					...conform.textarea(fields.content),
					autoComplete: 'content',
				}}
				errors={fields.content.errors}
				className="flex flex-col gap-y-2 flex-1 [&_textarea]:flex-1 [&_textarea]:resize-none"
			/>
			<ErrorList errors={form.errors} id={form.errorId} />
			<div className="shadow-accent shadow-xl w-full flex justify-end gap-4 bg-accent/50 backdrop-blur">
				<Button variant="secondary" type="reset">
					<Icon name="reset" className="mr-2 scale-125" />
					Reset
				</Button>
				<StatusButton
					status={
						noteEditorFetcher.state === 'submitting'
							? 'pending'
							: noteEditorFetcher.data?.status ?? 'idle'
					}
					type="submit"
					disabled={noteEditorFetcher.state !== 'idle'}
				>
					<Icon name="check" className="mr-2 scale-125" />
					Submit
				</StatusButton>
			</div>
		</noteEditorFetcher.Form>
	)
}
