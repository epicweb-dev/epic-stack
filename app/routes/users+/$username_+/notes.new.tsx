import { json, type LoaderFunctionArgs } from '@remix-run/node'

import { requireUserId } from '#app/utils/auth.server.ts'

import { NoteEditor } from './__note-editor.tsx'

export { action } from './__note-editor.server.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export default NoteEditor
