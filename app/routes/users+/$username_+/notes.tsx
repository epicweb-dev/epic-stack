import { json, type DataFunctionArgs } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import {
	GeneralErrorBoundary,
	Main,
	MainContainer,
	MainContent,
	PageSidebar,
} from '#app/components/index.ts'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const owner = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
			notes: { select: { id: true, title: true } },
		},
		where: { username: params.username },
	})

	invariantResponse(owner, 'Owner not found', { status: 404 })

	return json({ owner })
}

export default function NotesRoute() {
	const data = useLoaderData<typeof loader>()
	const { owner } = data
	return (
		<Main>
			<MainContainer>
				<PageSidebar
					owner={owner}
					title="Notes"
					headerLink={`/users/${owner.username}`}
					avatar={true}
					list={owner.notes}
					newTitle="New Note"
					displayNew
				/>
				<MainContent>
					<Outlet />
				</MainContent>
			</MainContainer>
		</Main>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}
