import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { Link, Outlet, useMatches } from 'react-router'
import { z } from 'zod'
import { Spacer } from '#app/components/spacer.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { userIdContext } from '#app/context.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { useUser } from '#app/utils/user.ts'
import { type Route } from './+types/profile.ts'

export const BreadcrumbHandle = z.object({ breadcrumb: z.any() })
export type BreadcrumbHandle = z.infer<typeof BreadcrumbHandle>

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="file-text">Edit Profile</Icon>,
	getSitemapEntries: () => null,
}

export async function loader({ context }: Route.LoaderArgs) {
	const userId = context.get(userIdContext) as string | null
	invariantResponse(Boolean(userId), 'Unauthorized', { status: 401 })
	const user = await prisma.user.findUnique({
		where: { id: userId as string },
		select: { username: true },
	})
	invariantResponse(user, 'User not found', { status: 404 })
	return {}
}

const BreadcrumbHandleMatch = z.object({
	handle: BreadcrumbHandle,
})

export default function EditUserProfile() {
	const user = useUser()
	const matches = useMatches()
	const breadcrumbs = matches
		.map((m) => {
			const result = BreadcrumbHandleMatch.safeParse(m)
			if (!result.success || !result.data.handle.breadcrumb) return null
			return (
				<Link key={m.id} to={m.pathname} className="flex items-center">
					{result.data.handle.breadcrumb}
				</Link>
			)
		})
		.filter(Boolean)

	return (
		<div className="m-auto mt-16 mb-24 max-w-3xl">
			<div className="container">
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
							<Icon name="arrow-right" size="sm">
								{breadcrumb}
							</Icon>
						</li>
					))}
				</ul>
			</div>
			<Spacer size="xs" />
			<main className="bg-muted mx-auto px-6 py-8 md:container md:rounded-3xl">
				<Outlet />
			</main>
		</div>
	)
}
