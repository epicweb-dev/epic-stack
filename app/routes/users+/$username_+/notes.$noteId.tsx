import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { DeleteNote } from '~/routes/resources+/delete-note.tsx'
import { getUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { formatDistanceToNow } from 'date-fns'

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
	const date = new Date(note.updatedAt)
	const timeAgo = formatDistanceToNow(date)
	return json({
		note,
		timeAgo,
		dateDisplay: date.toLocaleDateString(),
		isOwner: userId === note.ownerId,
	})
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<>
			<div className="absolute inset-0 flex flex-col px-10">
				<h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.note.title}</h2>
				<div className={`${data.isOwner ? 'pb-24' : 'pb-12'} overflow-y-auto`}>
					<p className="text-sm md:text-lg">{data.note.content}</p>
				</div>
			</div>
			{data.isOwner ? (
				<div className="floating-toolbar">
					<span
						className="text-sm text-foreground/90 max-[524px]:hidden"
						title={data.dateDisplay}
					>
						<Icon name="clock" className="mr-2 scale-125" />
						{data.timeAgo} ago
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
						<DeleteNote id={data.note.id} />
						<Button
							asChild
							className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
						>
							<Link to="edit">
								<Icon
									name="pencil-1"
									className="scale-125 max-md:scale-150 md:mr-2"
								/>
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
