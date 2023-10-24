import { json, type DataFunctionArgs } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import {
	Main,
	MainContainer,
	MainContent,
} from '#app/components/layout/index.ts'
import { PageSidebar } from '#app/components/templates/index.ts'
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
				<PageSidebar owner={owner} title="Notes" list={owner.notes} />
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
