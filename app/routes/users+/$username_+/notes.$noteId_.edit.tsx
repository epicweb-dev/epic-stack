import { invariantResponse } from '@epic-web/invariant'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/notes.$noteId_.edit.ts'
import { NoteEditor } from './__note-editor.tsx'

export { action } from './__note-editor.server.tsx'

export async function loader({ params, request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const note = await prisma.note.findFirst({
		select: {
			id: true,
			title: true,
			content: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
		where: {
			id: params.noteId,
			ownerId: userId,
		},
	})
	invariantResponse(note, 'Not found', { status: 404 })
	return { note }
}

export default function NoteEdit({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return <NoteEditor note={loaderData.note} actionData={actionData} />
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No note with the id "{params.noteId}" exists</p>
				),
			}}
		/>
	)
}
