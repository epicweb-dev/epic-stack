import { Link } from '@remix-run/react'
import { Button } from '#app/components/index.ts'
import { DeleteNote } from '#app/routes/users+/$username_+/notes.$noteId.tsx'
import { floatingToolbarClassName } from '../floating-toolbar.tsx'
import { Icon, type IconName } from '../ui/icon.tsx'

interface ContentActionbarProps {
	timestamp?: string
	canDelete?: boolean
	itemId: string
}

function ContentActionbar({
	timestamp,
	canDelete,
	itemId,
}: ContentActionbarProps) {
	const ContentActionbarTimestamp = () => {
		return (
			<span className="text-sm text-foreground/90 max-[524px]:hidden">
				<Icon name="clock" className="scale-125">
					{timestamp} ago
				</Icon>
			</span>
		)
	}

	interface ContentActionbarButtonProps {
		label: string
		iconName?: IconName
	}

	const ContentActionbarButton = ({
		label,
		iconName,
	}: ContentActionbarButtonProps) => {
		return (
			<Button
				asChild
				className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
			>
				<Link to="edit">
					{iconName ? (
						<Icon name={iconName} className="scale-125 max-md:scale-150">
							<span className="max-md:hidden">{label}</span>
						</Icon>
					) : (
						<span>{label}</span>
					)}
				</Link>
			</Button>
		)
	}

	return (
		<div className={floatingToolbarClassName}>
			{timestamp ? <ContentActionbarTimestamp /> : null}
			<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
				{canDelete ? <DeleteNote id={itemId} /> : null}
				<ContentActionbarButton label="Edit" iconName="pencil-1" />
			</div>
		</div>
	)
}

export { ContentActionbar }
