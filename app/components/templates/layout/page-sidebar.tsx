import {
	SidebarAvatar,
	SidebarHeader,
	SidebarList,
	type SidebarListItem,
} from '#app/components/layout/index.ts'
import { Sidebar } from '#app/components/layout/sidebar.tsx'
import { type OwnerData, useOptionalUser } from '#app/utils/user.ts'

interface PageSidebarProps {
	owner: OwnerData
	title: string
	headerLink: string
	avatar?: boolean
	list: SidebarListItem[]
	newTitle?: string
	displayNew?: boolean
}

function PageSidebar({
	owner,
	title,
	headerLink,
	avatar,
	list,
	newTitle,
	displayNew = false,
}: PageSidebarProps) {
	const user = useOptionalUser()
	const isOwner = user?.id === owner.id
	const ownerDisplayName = owner.name ?? owner.username

	const SidebarHeading = () => {
		return (
			<h1 className="text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
				{title || ownerDisplayName}
			</h1>
		)
	}
	return (
		<Sidebar>
			<div className="absolute inset-0 flex flex-col">
				<SidebarHeader to={headerLink}>
					{avatar && (
						<SidebarAvatar
							ownerDisplayName={ownerDisplayName}
							ownerImageId={owner.image?.id}
						/>
					)}
					<SidebarHeading />
				</SidebarHeader>
				<SidebarList
					displayNew={displayNew && isOwner}
					items={list}
					newTitle={newTitle}
				/>
			</div>
		</Sidebar>
	)
}

export { PageSidebar }
