import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { Button, ErrorList } from '~/utils/forms.tsx'
import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { redirectWithToast } from '~/utils/flash-session.server.ts'

const DeleteFormSchema = z.object({
	noteId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: DeleteFormSchema,
		acceptMultipleErrors: () => true,
	})
	if (!submission.value || submission.intent !== 'submit') {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}

	const { noteId } = submission.value

	const note = await prisma.note.findFirst({
		select: { id: true, owner: { select: { username: true } } },
		where: {
			id: noteId,
			ownerId: userId,
		},
	})
	if (!note) {
		submission.error.noteId = ['Note not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.note.delete({
		where: { id: note.id },
	})

	return redirectWithToast(`/users/${note.owner.username}/notes`, {
		type: 'success',
		text: 'Note deleted',
	})
}

export function DeleteNote({ id }: { id: string }) {
	const noteDeleteFetcher = useFetcher<typeof action>()

	const [form] = useForm({
		id: 'delete-note',
		constraint: getFieldsetConstraint(DeleteFormSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: DeleteFormSchema })
		},
	})

	return (
		<noteDeleteFetcher.Form
			method="post"
			action="/resources/delete-note"
			{...form.props}
		>
			<input type="hidden" name="noteId" value={id} />
			<Button
				type="submit"
				size="md"
				variant="secondary"
				status={
					noteDeleteFetcher.state === 'submitting'
						? 'pending'
						: noteDeleteFetcher.data?.status ?? 'idle'
				}
				disabled={noteDeleteFetcher.state !== 'idle'}
			>
				Delete
			</Button>
			<ErrorList errors={form.errors} id={form.errorId} />
		</noteDeleteFetcher.Form>
	)
}
