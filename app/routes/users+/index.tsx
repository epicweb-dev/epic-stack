import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { desc, eq, like, or } from 'drizzle-orm'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { SearchBar } from '#app/components/search-bar.tsx'
import { drizzle } from '#app/utils/db.server'
import { cn, getUserImgSrc, useDelayedIsPending } from '#app/utils/misc.tsx'
import { Note, UserImage, User } from '#drizzle/schema'

export async function loader({ request }: LoaderFunctionArgs) {
	try {
		const searchTerm = new URL(request.url).searchParams.get('search')
		if (searchTerm === '') {
			return redirect('/users')
		}

		const likeQuery = `%${searchTerm ?? ''}%`
		const users = await drizzle
			.select({
				id: User.id,
				username: User.username,
				name: User.name,
				imageId: UserImage.id,
			})
			.from(User)
			.leftJoin(UserImage, eq(User.id, UserImage.userId))
			.where(or(like(User.username, likeQuery), like(User.name, likeQuery)))
			.orderBy(
				desc(
					drizzle
						.select({ updatedAt: Note.updatedAt })
						.from(Note)
						.where(eq(Note.ownerId, User.id))
						.orderBy(desc(Note.updatedAt))
						.limit(1),
				),
			)
			.limit(50)
		return json({ status: 'idle', users } as const)
	} catch (error) {
		console.error(error)
		return json({ status: 'error', error } as const)
	}
}

export default function UsersRoute() {
	const data = useLoaderData<typeof loader>()
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/users',
	})

	if (data.status === 'error') {
		console.error(data.error)
	}

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">Epic Notes Users</h1>
			<div className="w-full max-w-[700px]">
				<SearchBar status={data.status} autoFocus autoSubmit />
			</div>
			<main>
				{data.status === 'idle' ? (
					data.users.length ? (
						<ul
							className={cn(
								'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
								{ 'opacity-50': isPending },
							)}
						>
							{data.users.map((user) => (
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
						<p>No users found</p>
					)
				) : data.status === 'error' ? (
					<ErrorList errors={['There was an error parsing the results']} />
				) : null}
			</main>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
