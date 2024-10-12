import { useNotesMetadata } from './notes.tsx'

export default function NotesIndexRoute() {
	const { displayName, noteCount } = useNotesMetadata()
	const notesText = noteCount === 1 ? 'note' : 'notes'
	return (
		<div className="container pt-12">
			<title>{`${displayName}'s Notes | Epic Notes`}</title>
			<meta
				name="description"
				content={`Checkout ${displayName}'s ${noteCount} ${notesText} on Epic Notes`}
			/>
			<p className="text-body-md">Select a note</p>
		</div>
	)
}
