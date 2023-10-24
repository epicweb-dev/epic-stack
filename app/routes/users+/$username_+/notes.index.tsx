import { type MetaFunction } from '@remix-run/react'
import { PageContentIndex } from '#app/components/templates/index.ts'
import { type loader as notesLoader } from './notes.tsx'

export default function NotesIndexRoute() {
	return <PageContentIndex message="Select a note" />
}

export const meta: MetaFunction<
	null,
	{ 'routes/users+/$username_+/notes': typeof notesLoader }
> = ({ params, matches }) => {
	const notesMatch = matches.find(
		m => m.id === 'routes/users+/$username_+/notes',
	)
	const displayName = notesMatch?.data?.owner.name ?? params.username
	const noteCount = notesMatch?.data?.owner.notes.length ?? 0
	const notesText = noteCount === 1 ? 'note' : 'notes'
	return [
		{ title: `${displayName}'s Notes | Epic Notes` },
		{
			name: 'description',
			content: `Checkout ${displayName}'s ${noteCount} ${notesText} on Epic Notes`,
		},
	]
}
