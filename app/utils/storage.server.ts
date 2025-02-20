import { type FileUpload } from '@mjackson/form-data-parser'
import { createId } from '@paralleldrive/cuid2'

const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT
const STORAGE_BUCKET = process.env.STORAGE_BUCKET
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY

async function uploadToStorage(file: File | FileUpload, key: string) {
	const url = getImageUrl(key)
	const uploadResponse = await fetch(url, {
		method: 'PUT',
		headers: {
			'Content-Type': file.type,
			Authorization: `Basic ${btoa(`${STORAGE_ACCESS_KEY}:${STORAGE_SECRET_KEY}`)}`,
			'x-amz-meta-upload-date': new Date().toISOString(),
		},
		body: file instanceof File ? file : Buffer.from(await file.arrayBuffer()),
	})

	if (!uploadResponse.ok) {
		const errorMessage = `Failed to upload file to storage. Server responded with ${uploadResponse.status}: ${uploadResponse.statusText}`
		console.error(errorMessage)
		throw new Error(`Failed to upload object: ${key}`)
	}

	return key
}

export async function uploadProfileImage(
	userId: string,
	file: File | FileUpload,
) {
	const fileId = createId()
	const fileExtension = file.name.split('.').pop() || ''
	const timestamp = Date.now()
	const key = `users/${userId}/profile-images/${timestamp}-${fileId}.${fileExtension}`
	return uploadToStorage(file, key)
}

export async function uploadNoteImage(
	userId: string,
	noteId: string,
	file: File | FileUpload,
) {
	const fileId = createId()
	const fileExtension = file.name.split('.').pop() || ''
	const timestamp = Date.now()
	const key = `users/${userId}/notes/${noteId}/images/${timestamp}-${fileId}.${fileExtension}`
	return uploadToStorage(file, key)
}

export function getImageUrl(imageId: string) {
	return `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/${imageId}`
}
