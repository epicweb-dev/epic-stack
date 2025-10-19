import { requireUserId } from '#app/utils/auth.server.ts'
import { NoteEditor } from './+shared/note-editor.tsx'
import { type Route } from './+types/new.ts'

export { action } from './+shared/note-editor.server.tsx'

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return {}
}

export default NoteEditor
