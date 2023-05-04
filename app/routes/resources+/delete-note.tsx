import { json, type DataFunctionArgs, redirect } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import {
	Button,
	getFieldsFromSchema,
	preprocessFormData,
	useForm,
} from '~/utils/forms'
import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

const DeleteFormSchema = z.object({
	noteId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const result = DeleteFormSchema.safeParse(
		preprocessFormData(formData, DeleteFormSchema),
	)
	if (!result.success) {
		return json({ status: 'error', errors: result.error.flatten() } as const, {
			status: 400,
		})
	}
	const { noteId } = result.data
	const note = await prisma.note.findFirst({
		select: { id: true, owner: { select: { username: true } } },
		where: {
			id: noteId,
			ownerId: userId,
		},
	})
	if (!note) {
		return json(
			{ status: 'error', errors: { formErrors: ['Note not found'] } } as const,
			{
				status: 404,
			},
		)
	}

	await prisma.note.delete({
		where: { id: note.id },
	})

	return redirect(`/users/${note.owner.username}/notes`)
}

export function DeleteNote({ id }: { id: string }) {
	const noteDeleteFetcher = useFetcher<typeof action>()

	const { form } = useForm({
		name: 'delete-note',
		errors: {
			...noteDeleteFetcher.data?.errors,
			formErrors: noteDeleteFetcher.data?.errors?.formErrors,
		},
		fieldMetadatas: getFieldsFromSchema(DeleteFormSchema),
	})

	return (
		<noteDeleteFetcher.Form
			method="post"
			action="/resources/delete-note"
			{...form}
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
			{form.errorUI}
		</noteDeleteFetcher.Form>
	)
}
