import {
	json,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
	type DataFunctionArgs,
} from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import invariant from 'tiny-invariant'
import { prisma } from '~/utils/db.server.ts'

const MAX_SIZE = 1024 * 1024 * 5 // 5MB

export async function action({ request }: DataFunctionArgs) {
	const contentLength = Number(request.headers.get('Content-Length'))
	if (
		contentLength &&
		Number.isFinite(contentLength) &&
		contentLength > MAX_SIZE
	) {
		return json({ errors: 'File too large' }, { status: 400 })
	}
	const formData = await unstable_parseMultipartFormData(
		request,
		unstable_createMemoryUploadHandler({ maxPartSize: MAX_SIZE }),
	)

	const file = formData.get('file')
	invariant(file instanceof File, 'file not the right type')
	const altText = formData.get('altText')
	const image = await prisma.image.create({
		select: { fileId: true },
		data: {
			contentType: file.type,
			altText: typeof altText === 'string' ? altText : undefined,
			file: {
				create: {
					blob: Buffer.from(await file.arrayBuffer()),
				},
			},
		},
	})

	return json({ fileId: image.fileId })
}

export function ImageUpload() {
	const fetcher = useFetcher<typeof action>()

	return (
		<fetcher.Form
			method="POST"
			encType="multipart/form-data"
			action="/resources/image-upload"
		>
			<label htmlFor="file-input">File</label>
			<input id="file-input" type="file" name="file" />
			<input id="alt-text" type="text" name="altText" placeholder="Alt text" />
			<button type="submit">Upload</button>
		</fetcher.Form>
	)
}

export default function ImageUploader() {
	return <ImageUpload />
}
