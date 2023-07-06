import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { DeleteNote } from '~/routes/resources+/delete-note.tsx'
import { getUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { formatDistanceToNow } from 'date-fns';

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
			updatedAt: true,
		},
	})
	if (!note) {
		throw new Response('Not found', { status: 404 })
	}
	return json({ note, isOwner: userId === note.ownerId })
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()
	const date = new Date(data.note.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	return (
		<>
			<div className="flex h-full flex-col overflow-x-hidden px-10">
				<div className={`flex-grow pt-12 ${data.isOwner ? 'pb-24' : 'pb-12'}`}>
					<h2 className="mb-2 text-h2 lg:mb-6">{data.note.title}</h2>
					<p className="text-sm md:text-lg">{data.note.content}</p>
				</div>
			</div>
			{data.isOwner ? (
				<div className="flex space-between items-center absolute left-3 right-3 bottom-3 p-4 pl-5 md:pl-7 rounded-lg shadow-accent shadow-xl gap-2 bg-muted/80 backdrop-blur-sm">
					<span className="max-[525px]:hidden text-sm text-foreground/90" title={date.toLocaleString()}>
						<Icon name="clock" className="mr-2 scale-125" />
						{timeAgo} ago
					</span>
					<div className="flex-1 grid grid-cols-2 min-[525px]:flex justify-end gap-2 md:gap-4">
						<DeleteNote id={data.note.id} />
						<Button asChild>
							<Link to="edit">
								<Icon name="pencil-1" className="md:mr-2 scale-125 max-md:scale-150" />
								<span className="max-md:hidden">Edit</span>
							</Link>
						</Button>
					</div>
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
