import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { NoteEditor } from '~/routes/resources+/note-editor.tsx'
import { prisma } from '~/utils/db.server.ts'

export async function loader({ params }: DataFunctionArgs) {
	const note = await prisma.note.findUnique({
		where: {
			id: params.noteId,
		},
	})
	if (!note) {
		throw new Response('Not found', { status: 404 })
	}
	return json({ note: note })
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()

	return <NoteEditor note={data.note} />
}
