import { type FileUpload } from '@mjackson/form-data-parser'

/**
 * Handles the upload of a single file and converts it into a File object.
 *
 * @param {FileUpload} file - The FileUpload object to process.
 * @returns {Promise<File>} - A promise that resolves with the converted File object.
 */
export async function uploadHandler(file: FileUpload): Promise<File> {
	const fileContent = await file.arrayBuffer() // Get file content as an ArrayBuffer
	const fileInstance = new File([fileContent], file.name, {
		type: file.type,
		lastModified: file.lastModified,
	})
	return fileInstance
}
