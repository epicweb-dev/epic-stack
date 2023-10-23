interface ContentHeaderProps {
	title: string
}

function ContentHeader({ title }: ContentHeaderProps) {
	return <h2 className="mb-2 pt-12 text-h2 lg:mb-6">{title}</h2>
}

export { ContentHeader }
