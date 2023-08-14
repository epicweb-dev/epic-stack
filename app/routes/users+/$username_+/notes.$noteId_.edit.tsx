import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { invariantResponse } from '~/utils/misc.tsx'
import { NoteEditor, action } from './__note-editor.tsx'

export { action }

export async function loader({ params, request }: DataFunctionArgs) {
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
	return json({ note: note })
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()

	return <NoteEditor note={data.note} />
}
