import { json } from '@remix-run/router'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { NoteEditor } from '~/routes/resources+/note-editor.tsx'
import { requireUserId } from '~/utils/auth.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export default function NewNoteRoute() {
	return <NoteEditor />
}
