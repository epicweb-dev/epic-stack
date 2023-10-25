import { NavLink } from '@remix-run/react'
import { Icon } from '#app/components/index.ts'
import { cn } from '#app/utils/misc.tsx'
import { type OwnerListData } from '#app/utils/user.ts'
import { ListItem } from './list-item.tsx'
import { List } from './list.tsx'

interface SidebarAvatarProps {
	isOwner: boolean
	items: OwnerListData[]
}

const navLinkDefaultClassName =
	'line-clamp-2 block rounded-l-full py-2 pl-8 pr-6 text-base lg:text-xl'

function SidebarList({ isOwner, items }: SidebarAvatarProps) {
	const newItem = () => {
		return (
			<ListItem variant="sidebar">
				<NavLink
					to="new"
					className={({ isActive }) =>
						cn(navLinkDefaultClassName, isActive && 'bg-accent')
					}
				>
					<Icon name="plus">New Note</Icon>
				</NavLink>
			</ListItem>
		)
	}

	return (
		<List variant="sidebar">
			{isOwner ? newItem() : null}
			{items.map(item => (
				<ListItem key={item.id} variant="sidebar">
					<NavLink
						to={item.id}
						preventScrollReset
						prefetch="intent"
						className={({ isActive }) =>
							cn(navLinkDefaultClassName, isActive && 'bg-accent')
						}
					>
						{item.title}
					</NavLink>
				</ListItem>
			))}
		</List>
	)
}

export { SidebarList }
