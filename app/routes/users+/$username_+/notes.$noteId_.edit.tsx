import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { NoteEditor } from './__note-editor.tsx'

export { action } from './__note-editor.server.tsx'

export async function loader({ params, request }: LoaderFunctionArgs) {
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
	return { note: note }
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()

	return <NoteEditor note={data.note} />
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
