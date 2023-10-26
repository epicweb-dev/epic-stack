import { getUserImgSrc } from '#app/utils/misc.tsx'

interface SidebarAvatarProps {
	ownerDisplayName: string
	ownerImageId?: string | null
}

function SidebarAvatar({ ownerDisplayName, ownerImageId }: SidebarAvatarProps) {
	return (
		<img
			src={getUserImgSrc(ownerImageId)}
			alt={ownerDisplayName}
			className="h-16 w-16 rounded-full object-cover lg:h-24 lg:w-24"
		/>
	)
}

export { SidebarAvatar }
