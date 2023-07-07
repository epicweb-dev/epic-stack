import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { ErrorList } from '~/components/forms.tsx'
import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { Icon } from '~/components/ui/icon.tsx'

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
		title: 'Note deleted',
		variant: 'destructive',
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
			<StatusButton
				type="submit"
				variant="destructive"
				status={
					noteDeleteFetcher.state === 'submitting'
						? 'pending'
						: noteDeleteFetcher.data?.status ?? 'idle'
				}
				disabled={noteDeleteFetcher.state !== 'idle'}
				className="w-full max-md:px-0 max-md:aspect-square"
			>
				<Icon name="trash" className="md:mr-2 scale-125 max-md:scale-150" />
				<span className="max-md:hidden">Delete</span>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</noteDeleteFetcher.Form>
	)
}
