import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { formatDistanceToNow } from 'date-fns'
import { data, Form, Link } from 'react-router'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getNoteImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { userHasPermission, useOptionalUser } from '#app/utils/user.ts'
import { type Route, type Info } from './+types/notes.$noteId.ts'
import { type Info as notesInfo } from './+types/notes.ts'
import { Img } from 'openimg/react'

export async function loader({ params }: Route.LoaderArgs) {
	const note = await prisma.note.findUnique({
		where: { id: params.noteId },
		select: {
			id: true,
			title: true,
			content: true,
			ownerId: true,
			updatedAt: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
	})

	invariantResponse(note, 'Not found', { status: 404 })

	const date = new Date(note.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	return { note, timeAgo }
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-note'),
	noteId: z.string(),
})

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteFormSchema,
	})
	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { noteId } = submission.value

	const note = await prisma.note.findFirst({
		select: { id: true, ownerId: true, owner: { select: { username: true } } },
		where: { id: noteId },
	})
	invariantResponse(note, 'Not found', { status: 404 })

	const isOwner = note.ownerId === userId
	await requireUserWithPermission(
		request,
		isOwner ? `delete:note:own` : `delete:note:any`,
	)

	await prisma.note.delete({ where: { id: note.id } })

	return redirectWithToast(`/users/${note.owner.username}/notes`, {
		type: 'success',
		title: 'Success',
		description: 'Your note has been deleted.',
	})
}

export default function NoteRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const user = useOptionalUser()
	const isOwner = user?.id === loaderData.note.ownerId
	const canDelete = userHasPermission(
		user,
		isOwner ? `delete:note:own` : `delete:note:any`,
	)
	const displayBar = canDelete || isOwner

	return (
		<div className="absolute inset-0 flex flex-col px-10">
			<h2 className="mb-2 pt-12 text-h2 lg:mb-6">{loaderData.note.title}</h2>
			<div className={`${displayBar ? 'pb-24' : 'pb-12'} overflow-y-auto`}>
				<ul className="flex flex-wrap gap-5 py-5">
					{loaderData.note.images.map((image) => (
						<li key={image.id}>
							<a href={getNoteImgSrc(image.id)}>
								<Img
									src={getNoteImgSrc(image.id)}
									alt={image.altText ?? ''}
									className="h-32 w-32 rounded-lg object-cover"
									width={516}
									height={516}
								/>
							</a>
						</li>
					))}
				</ul>
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{loaderData.note.content}
				</p>
			</div>
			{displayBar ? (
				<div className={floatingToolbarClassName}>
					<span className="text-sm text-foreground/90 max-[524px]:hidden">
						<Icon name="clock" className="scale-125">
							{loaderData.timeAgo} ago
						</Icon>
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
						{canDelete ? (
							<DeleteNote id={loaderData.note.id} actionData={actionData} />
						) : null}
						<Button
							asChild
							className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
						>
							<Link to="edit">
								<Icon name="pencil-1" className="scale-125 max-md:scale-150">
									<span className="max-md:hidden">Edit</span>
								</Icon>
							</Link>
						</Button>
					</div>
				</div>
			) : null}
		</div>
	)
}

export function DeleteNote({
	id,
	actionData,
}: {
	id: string
	actionData: Info['actionData'] | undefined
}) {
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-note',
		lastResult: actionData?.result,
	})

	return (
		<Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name="noteId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-note"
				variant="destructive"
				status={isPending ? 'pending' : (form.status ?? 'idle')}
				disabled={isPending}
				className="w-full max-md:aspect-square max-md:px-0"
			>
				<Icon name="trash" className="scale-125 max-md:scale-150">
					<span className="max-md:hidden">Delete</span>
				</Icon>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}

export const meta: Route.MetaFunction = ({ data, params, matches }) => {
	const notesMatch = matches.find(
		(m) => m?.id === 'routes/users+/$username_+/notes',
	) as { data: notesInfo['loaderData'] } | undefined

	const displayName = notesMatch?.data?.owner.name ?? params.username
	const noteTitle = data?.note.title ?? 'Note'
	const noteContentsSummary =
		data && data.note.content.length > 100
			? data?.note.content.slice(0, 97) + '...'
			: 'No content'
	return [
		{ title: `${noteTitle} | ${displayName}'s Notes | Epic Notes` },
		{
			name: 'description',
			content: noteContentsSummary,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: () => <p>You are not allowed to do that</p>,
				404: ({ params }) => (
					<p>No note with the id "{params.noteId}" exists</p>
				),
			}}
		/>
	)
}
