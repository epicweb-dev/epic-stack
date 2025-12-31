import { APP_TITLE } from '#app/utils/branding.ts'
import { type Route as NotesRoute } from './+types/_layout.ts'
import { type Route } from './+types/index.ts'

export default function NotesIndexRoute() {
	return (
		<div className="container pt-12">
			<p className="text-body-md">Select a note</p>
		</div>
	)
}

export const meta: Route.MetaFunction = ({ params, matches }) => {
	const notesMatch = matches.find(
		(m) => m?.id === 'routes/users/$username/notes',
	) as { data: NotesRoute.ComponentProps['loaderData'] }

	const displayName = notesMatch?.data?.owner.name ?? params.username
	const noteCount = notesMatch?.data?.owner.notes.length ?? 0
	const notesText = noteCount === 1 ? 'note' : 'notes'
	return [
		{ title: `${displayName}'s Notes | ${APP_TITLE}` },
		{
			name: 'description',
			content: `Checkout ${displayName}'s ${noteCount} ${notesText} on ${APP_TITLE}`,
		},
	]
}
