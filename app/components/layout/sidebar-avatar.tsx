import { Link } from '@remix-run/react'
import { getUserImgSrc } from '#app/utils/misc.tsx'

interface SidebarAvatarProps {
	ownerDisplayName: string
	ownerUsername: string
	ownerImageId?: string | null
	title?: string
}

function SidebarAvatar({
	ownerDisplayName,
	ownerUsername,
	ownerImageId,
	title,
}: SidebarAvatarProps) {
	return (
		<Link
			to={`/users/${ownerUsername}`}
			className="flex flex-col items-center justify-center gap-2 bg-muted pb-4 pl-8 pr-4 pt-12 lg:flex-row lg:justify-start lg:gap-4"
		>
			<img
				src={getUserImgSrc(ownerImageId)}
				alt={ownerDisplayName}
				className="h-16 w-16 rounded-full object-cover lg:h-24 lg:w-24"
			/>
			<h1 className="text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
				{title || ownerDisplayName}
			</h1>
		</Link>
	)
}

export { SidebarAvatar }
