import { type LoaderFunctionArgs } from 'react-router';
import { requireUserId } from '#app/utils/auth.server.ts'
import { NoteEditor } from './__note-editor.tsx'

export { action } from './__note-editor.server.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return {}
}

export default NoteEditor
