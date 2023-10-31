import { json, type DataFunctionArgs } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import {
	Main,
	MainContainer,
	MainContent,
} from '#app/components/layout/index.ts'
import { PageSidebar } from '#app/components/templates/index.ts'
import { requireAdminUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireAdminUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
		},
	})
	invariantResponse(user, 'User not found', { status: 404 })
	return json({ user })
}

export default function AdminRoute() {
	const data = useLoaderData<typeof loader>()
	const { user } = data

	const list = [{ id: 'users', title: 'Users' }]

	return (
		<Main>
			<MainContainer>
				<PageSidebar
					owner={user}
					title="Admin"
					headerLink="/admin"
					list={list}
				/>
				<MainContent>
					<Outlet />
				</MainContent>
			</MainContainer>
		</Main>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
