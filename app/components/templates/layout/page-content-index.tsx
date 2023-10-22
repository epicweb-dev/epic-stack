interface PageContentIndexProps {
	message: string
}

function PageContentIndex({ message }: PageContentIndexProps) {
	return (
		<div className="container pt-12">
			<p className="text-body-md">{message}</p>
		</div>
	)
}

export { PageContentIndex }
