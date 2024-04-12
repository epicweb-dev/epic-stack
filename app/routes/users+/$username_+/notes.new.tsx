import { json, type LoaderFunctionArgs } from '@remix-run/node'

import { NoteEditor } from '#/app/routes/users+/$username_+/__note-editor.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'


export { action } from './__note-editor.server.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export default NoteEditor
