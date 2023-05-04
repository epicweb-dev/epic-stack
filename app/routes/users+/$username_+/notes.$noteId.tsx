import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { DeleteNote } from '~/routes/resources+/delete-note'
import { getUserId } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { ButtonLink } from '~/utils/forms'

export async function loader({ request, params }: DataFunctionArgs) {
	const userId = await getUserId(request)
	const note = await prisma.note.findUnique({
		where: {
			id: params.noteId,
		},
		select: {
			id: true,
			title: true,
			content: true,
			ownerId: true,
		},
	})
	if (!note) {
		throw new Response('Not found', { status: 404 })
	}
	return json({ note, isOwner: userId === note.ownerId })
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="flex h-full flex-col">
			<div className="flex-grow">
				<h2 className="mb-2 text-h2 lg:mb-6">{data.note.title}</h2>
				<p className="text-sm md:text-lg">{data.note.content}</p>
			</div>
			{data.isOwner ? (
				<div className="flex justify-end gap-4">
					<DeleteNote id={data.note.id} />
					<ButtonLink size="md" variant="primary" to="edit">
						Edit
					</ButtonLink>
				</div>
			) : null}
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Note not found</p>,
			}}
		/>
	)
}
