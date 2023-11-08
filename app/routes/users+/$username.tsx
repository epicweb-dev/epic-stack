import { json, type DataFunctionArgs } from '@remix-run/node'
import { Form, Link, useLoaderData, type MetaFunction } from '@remix-run/react'
import {
	GeneralErrorBoundary,
	Button,
	Icon,
	Spacer,
} from '#app/components/index.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import {
	formatDate,
	getUserImgSrc,
	invariantResponse,
} from '#app/utils/misc.tsx'
import { userHasRole } from '#app/utils/permissions.ts'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	await requireUserId(request)
	const user = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
			roles: { select: { name: true, permissions: true } },
		},
		where: {
			username: params.username,
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	const isAdmin = userHasRole(user, 'admin')

	return json({
		user,
		isAdmin,
		userJoinedDisplay: formatDate(new Date(user.createdAt)),
	})
}

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	const { user, isAdmin } = data
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = data.user.id === loggedInUser?.id

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
				<div className="relative w-52">
					<div className="absolute -top-40">
						<div className="relative">
							<img
								src={getUserImgSrc(data.user.image?.id)}
								alt={userDisplayName}
								className="h-52 w-52 rounded-full object-cover"
							/>
						</div>
					</div>
				</div>

				<Spacer size="sm" />

				<div className="flex flex-col items-center">
					<div className="flex flex-wrap items-center justify-center gap-4">
						<h1 className="text-center text-h2">{userDisplayName}</h1>
					</div>
					<p className="mt-2 text-center text-muted-foreground">
						Joined {data.userJoinedDisplay}
					</p>
					{isAdmin ? (
						<p className="mt-2 text-center text-muted-foreground">Admin</p>
					) : null}
					{isLoggedInUser ? (
						<Form action="/logout" method="POST" className="mt-3">
							<Button type="submit" variant="link" size="pill">
								<Icon name="exit" className="scale-125 max-md:scale-150">
									Logout
								</Icon>
							</Button>
						</Form>
					) : null}
					<div className="mt-10 flex gap-4">
						{isLoggedInUser ? (
							<>
								<Button asChild>
									<Link to="notes" prefetch="intent">
										My notes
									</Link>
								</Button>
								<Button asChild>
									<Link to="/settings/profile" prefetch="intent">
										Edit profile
									</Link>
								</Button>
								{isAdmin ? (
									<Button asChild>
										<Link to="/admin" prefetch="intent">
											Admin
										</Link>
									</Button>
								) : null}
							</>
						) : (
							<Button asChild>
								<Link to="notes" prefetch="intent">
									{userDisplayName}'s notes
								</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username
	return [
		{ title: `${displayName} | Epic Notes` },
		{
			name: 'description',
			content: `Profile of ${displayName} on Epic Notes`,
		},
	]
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
