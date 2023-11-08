import {
	Content,
	ContentActionbar,
	ContentBody,
	ContentHeader,
	ContentImages,
} from '#app/components/index.ts'

interface PageContentShowProps {
	itemId: string
	title: string
	content: string
	displayBar?: boolean
	canDelete?: boolean
	images: {
		id: string
		altText?: string | null
	}[]
	timestamp?: string
}

function PageContentShow({
	itemId,
	title,
	content,
	displayBar,
	canDelete,
	images,
	timestamp,
}: PageContentShowProps) {
	return (
		<Content variant="show">
			<ContentHeader title={title} />
			<div className={`${displayBar ? 'pb-24' : 'pb-12'} overflow-y-auto`}>
				<ContentImages images={images} />
				<ContentBody content={content} />
			</div>
			{displayBar ? (
				<ContentActionbar
					timestamp={timestamp}
					canDelete={canDelete}
					itemId={itemId}
				/>
			) : null}
		</Content>
	)
}

export { PageContentShow }
