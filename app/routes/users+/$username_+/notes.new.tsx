import { json , type DataFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server.ts'
import { NoteEditor, action } from './__note-editor.tsx'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export { action }
export default NoteEditor
