import { Link } from '@remix-run/react'

interface SidebarHeaderProps {
	to: string
	children?: React.ReactNode
}

function SidebarHeader({ to, children }: SidebarHeaderProps) {
	return (
		<Link
			to={to}
			className="flex flex-col items-center justify-center gap-2 bg-muted pb-4 pl-8 pr-4 pt-12 lg:flex-row lg:justify-start lg:gap-4"
		>
			{children}
		</Link>
	)
}

export { SidebarHeader }
