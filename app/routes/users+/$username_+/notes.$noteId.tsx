import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Button } from '~/components/ui/button.tsx'
import { DeleteNote } from '~/routes/resources+/delete-note.tsx'
import { getUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'

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
		<>
			<div className="flex h-full flex-col overflow-x-hidden px-10">
				<div className={`flex-grow pt-12 ${data.isOwner ? 'pb-20' : 'pb-12'}`}>
					<h2 className="mb-2 text-h2 lg:mb-6">{data.note.title}</h2>
					<p className="text-sm md:text-lg">{data.note.content}</p>
				</div>
			</div>
			{data.isOwner ? (
				<div className="absolute px-10 py-4 shadow-accent shadow-xl w-full flex justify-end gap-4 bottom-0 bg-accent/50 backdrop-blur self-end rounded-lg">
					<DeleteNote id={data.note.id} />
					<Button asChild>
						<Link to="edit">Edit</Link>
					</Button>
				</div>
			) : null}
		</>
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
