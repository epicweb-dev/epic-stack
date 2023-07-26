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
import { floatingToolbarClassName } from '~/components/floating-toolbar.tsx'

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
		return json({ status: 'error', submission } as const, { status: 400 })
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
			className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
			{...form.props}
		>
			<input name="id" type="hidden" value={note?.id} />
			<Field
				labelProps={{ children: 'Title' }}
				inputProps={{
					...conform.input(fields.title),
					autoFocus: true,
				}}
				errors={fields.title.errors}
				className="flex flex-col gap-y-2"
			/>
			<TextareaField
				labelProps={{ children: 'Content' }}
				textareaProps={{
					...conform.textarea(fields.content),
					className: 'flex-1 resize-none',
				}}
				errors={fields.content.errors}
				className="flex flex-1 flex-col gap-y-2"
			/>
			<ErrorList errors={form.errors} id={form.errorId} />
			<div className={floatingToolbarClassName}>
				<Button
					variant="destructive"
					type="reset"
					className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
				>
					<Icon name="reset" className="scale-125 max-md:scale-150">
						<span className="max-md:hidden">Reset</span>
					</Icon>
				</Button>
				<StatusButton
					status={
						noteEditorFetcher.state === 'submitting'
							? 'pending'
							: noteEditorFetcher.data?.status ?? 'idle'
					}
					type="submit"
					disabled={noteEditorFetcher.state !== 'idle'}
					className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
				>
					<Icon name="arrow-right" className="scale-125 max-md:scale-150">
						<span className="max-md:hidden">Submit</span>
					</Icon>
				</StatusButton>
			</div>
		</noteEditorFetcher.Form>
	)
}
