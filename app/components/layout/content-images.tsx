import { getNoteImgSrc } from '#app/utils/misc.tsx'

interface ContentImagesProps {
	images: {
		id: string
		altText?: string | null
	}[]
}

function ContentImages({ images }: ContentImagesProps) {
	return (
		<ul className="flex flex-wrap gap-5 py-5">
			{images.map(image => (
				<li key={image.id}>
					<a href={getNoteImgSrc(image.id)}>
						<img
							src={getNoteImgSrc(image.id)}
							alt={image.altText ?? ''}
							className="h-32 w-32 rounded-lg object-cover"
						/>
					</a>
				</li>
			))}
		</ul>
	)
}

export { ContentImages }
