import { Content } from '#app/components/layout/index.ts'

interface PageContentIndexProps {
	message: string
}

function PageContentIndex({ message }: PageContentIndexProps) {
	return (
		<Content variant="index">
			<p className="text-body-md">{message}</p>
		</Content>
	)
}

export { PageContentIndex }
