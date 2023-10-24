import { SidebarAvatar, SidebarList } from '#app/components/layout/index.ts'
import { Sidebar } from '#app/components/layout/sidebar.tsx'
import {
	type OwnerData,
	type OwnerListData,
	useOptionalUser,
} from '#app/utils/user.ts'

interface PageSidebarProps {
	owner: OwnerData
	title: string
	list: OwnerListData[]
}

function PageSidebar({ owner, title, list }: PageSidebarProps) {
	const user = useOptionalUser()
	const isOwner = user?.id === owner.id
	const ownerDisplayName = owner.name ?? owner.username
	return (
		<Sidebar>
			<div className="absolute inset-0 flex flex-col">
				<SidebarAvatar
					ownerDisplayName={ownerDisplayName}
					ownerUsername={owner.username}
					ownerImageId={owner.image?.id}
					title={`${ownerDisplayName}'s ${title}`}
				/>
				<SidebarList isOwner={isOwner} items={list} />
			</div>
		</Sidebar>
	)
}

export { PageSidebar }
