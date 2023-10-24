interface ContentBodyProps {
	content: string
}

function ContentBody({ content }: ContentBodyProps) {
	return <p className="whitespace-break-spaces text-sm md:text-lg">{content}</p>
}

export { ContentBody }
