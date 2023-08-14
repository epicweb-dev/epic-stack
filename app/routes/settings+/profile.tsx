import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useMatches } from '@remix-run/react'
import { Spacer } from '~/components/spacer.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { cn, invariantResponse } from '~/utils/misc.tsx'
import { useUser } from '~/utils/user.ts'

export const handle = {
	breadcrumb: <Icon name="file-text">Edit Profile</Icon>,
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { username: true },
	})
	invariantResponse(user, 'User not found', { status: 404 })
	return json({})
}

export default function EditUserProfile() {
	const user = useUser()
	const matches = useMatches()
	const breadcrumbs = matches
		.map(m =>
			m.handle?.breadcrumb ? (
				<Link key={m.id} to={m.pathname} className="flex items-center">
					{m.handle.breadcrumb}
				</Link>
			) : null,
		)
		.filter(Boolean)

	return (
		<div className="container m-auto mb-36 mt-16 max-w-3xl">
			<ul className="flex gap-3">
				<li>
					<Link
						className="text-muted-foreground"
						to={`/users/${user.username}`}
					>
						Profile
					</Link>
				</li>
				{breadcrumbs.map((breadcrumb, i, arr) => (
					<li
						key={i}
						className={cn('flex items-center gap-3', {
							'text-muted-foreground': i < arr.length - 1,
						})}
					>
						▶️ {breadcrumb}
					</li>
				))}
			</ul>
			<Spacer size="xs" />
			<main>
				<Outlet />
			</main>
		</div>
	)
}
