import { json } from '@remix-run/router'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { requireUserId } from '../../../utils/auth.server.ts'
import { NoteEditor, action } from './__note-editor.tsx'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export { action }
export default NoteEditor
