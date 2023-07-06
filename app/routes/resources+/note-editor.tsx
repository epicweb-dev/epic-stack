import * as React from 'react'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ErrorList, Field, TextareaField } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'

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
	return redirect(`/users/${note.owner.username}/notes/${note.id}`)
}

export function NoteEditor({
	note,
}: {
	note?: { id: string; title: string; content: string }
}) {
	const noteEditorFetcher = useFetcher<typeof action>()
	const [content, setContent] = React.useState(note?.content ?? '')
	const [title, setTitle] = React.useState(note?.title ?? '')

	const [form, fields] = useForm({
		id: 'note-editor',
		constraint: getFieldsetConstraint(NoteEditorSchema),
		lastSubmission: noteEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: NoteEditorSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<noteEditorFetcher.Form
			method="post"
			action="/resources/note-editor"
			{...form.props}
		>
			<input name="id" type="hidden" value={note?.id} />
			<Field
				labelProps={{ htmlFor: fields.title.id, children: 'Title' }}
				inputProps={{
					value: title,
					onChange: event => setTitle(event.currentTarget.value),
					...conform.input(fields.title),
					autoComplete: 'title',
					autoFocus: true,
				}}
				errors={fields.title.errors}
			/>
			<Button
				className="mb-10"
				type="button"
				variant="secondary"
				size="pill"
				onClick={event => {
					event.preventDefault()

					// @ts-expect-error we'll fix this later probably...
					const content = event.currentTarget.form.elements.content.value

					const sse = new EventSource(
						`/resources/completions?${new URLSearchParams({ content })}`,
					)

					sse.addEventListener('message', event => {
						setTitle(
							prevTitle => prevTitle + event.data.replace('__NEWLINE__', '\n'),
						)
					})

					sse.addEventListener('error', event => {
						console.log('error: ', event)
						sse.close()
					})
				}}
			>
				Generate Title
			</Button>
			<TextareaField
				labelProps={{ htmlFor: fields.content.id, children: 'Content' }}
				textareaProps={{
					value: content,
					onChange: event => setContent(event.currentTarget.value),
					...conform.textarea(fields.content),
					autoComplete: 'content',
				}}
				errors={fields.content.errors}
			/>
			<Button
				className="mb-10"
				type="button"
				variant="secondary"
				size="pill"
				onClick={event => {
					event.preventDefault()

					// @ts-expect-error we'll fix this later probably...
					const title = event.currentTarget.form.elements.title.value

					const sse = new EventSource(
						`/resources/completions?${new URLSearchParams({ title })}`,
					)

					sse.addEventListener('message', event => {
						setContent(
							prevContent =>
								prevContent + event.data.replace('__NEWLINE__', '\n'),
						)
					})

					sse.addEventListener('error', event => {
						console.log('error: ', event)
						sse.close()
					})
				}}
			>
				Generate Content
			</Button>
			<ErrorList errors={form.errors} id={form.errorId} />
			<div className="flex justify-end gap-4">
				<Button
					size="default"
					variant="secondary"
					type="reset"
					onClick={() => {
						// because this is a controlled form, we need to reset the state
						// because the built-in browser behavior will no longer work.
						setContent(note?.content ?? '')
						setTitle(note?.title ?? '')
					}}
				>
					Reset
				</Button>
				<Button
					size="default"
					variant="default"
					// status={
					// 	noteEditorFetcher.state === 'submitting'
					// 		? 'pending'
					// 		: noteEditorFetcher.data?.status ?? 'idle'
					// }
					type="submit"
					disabled={noteEditorFetcher.state !== 'idle'}
				>
					Submit
				</Button>
			</div>
		</noteEditorFetcher.Form>
	)
}
