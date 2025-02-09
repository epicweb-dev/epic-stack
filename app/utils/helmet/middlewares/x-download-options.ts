export const xDownloadOptions = (): Headers => {
	const headers = new Headers()
	headers.set('X-Download-Options', 'noopen')
	return headers
}
