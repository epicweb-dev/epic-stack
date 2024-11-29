import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { eq, and } from 'drizzle-orm'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { drizzle } from '#app/utils/db.server.ts'
import { Note } from '#drizzle/schema.ts'
import { NoteEditor } from './__note-editor.tsx'

export { action } from './__note-editor.server.tsx'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const note = await drizzle.query.Note.findFirst({
		columns: {
			id: true,
			title: true,
			content: true,
		},
		with: {
			images: {
				columns: {
					id: true,
					altText: true,
				},
			},
		},
		where: and(eq(Note.id, params.noteId ?? ''), eq(Note.ownerId, userId)),
	})
	invariantResponse(note, 'Not found', { status: 404 })
	return json({ note: note })
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
