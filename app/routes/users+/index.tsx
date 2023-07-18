import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { SearchBar } from '~/components/search-bar.tsx'
import { prisma } from '~/utils/db.server.ts'
import { getUserImgSrc } from '~/utils/misc.ts'

const UserSearchResultSchema = z.object({
	id: z.string(),
	username: z.string(),
	name: z.string().nullable(),
	imageId: z.string().nullable(),
})

const UserSearchResultsSchema = z.array(UserSearchResultSchema)

export async function loader({ request }: DataFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (searchTerm === '') {
		return redirect('/users')
	}

	let rawUsers: Array<unknown>

	if (searchTerm) {
		rawUsers = await prisma.$queryRaw`
			SELECT id, username, name, imageId
			FROM user
			WHERE username LIKE ${`%${searchTerm ?? ''}%`}
			OR name LIKE ${`%${searchTerm ?? ''}%`}
			ORDER BY (
				SELECT updatedAt
				FROM note
				WHERE ownerId = user.id
				ORDER BY updatedAt DESC
				LIMIT 1
			) DESC
			LIMIT 50
		`
	} else {
		rawUsers = await prisma.$queryRaw`
			SELECT id, username, name, imageId
			FROM user
			ORDER BY (
				SELECT updatedAt
				FROM note
				WHERE ownerId = user.id
				ORDER BY updatedAt DESC
				LIMIT 1
			) DESC
			LIMIT 50
		`
	}

	const result = UserSearchResultsSchema.safeParse(rawUsers)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const)
	}
	return json({ status: 'idle', users: result.data } as const)
}

export default function UsersRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">Epic Notes Users</h1>
			<div className="w-full max-w-[700px] ">
				<SearchBar status={data.status} autoFocus autoSubmit />
			</div>
			{data.status === 'idle' ? (
				<ul className="flex w-full flex-wrap items-center justify-center gap-4">
					{data.users.map(user => (
						<li key={user.id}>
							<Link
								to={user.username}
								className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
							>
								<img
									alt={user.name ?? user.username}
									src={getUserImgSrc(user.imageId)}
									className="h-16 w-16 rounded-full"
								/>
								{user.name ? (
									<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
										{user.name}
									</span>
								) : null}
								<span className="w-full overflow-hidden text-ellipsis text-center text-body-sm text-muted-foreground">
									{user.username}
								</span>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<>
					<div>Uh oh... An error happened!</div>
					<pre>{data.error}</pre>
				</>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
