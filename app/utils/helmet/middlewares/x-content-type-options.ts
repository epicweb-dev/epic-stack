export const xContentTypeOptions = (): Headers => {
	const headers = new Headers()
	headers.set('X-Content-Type-Options', 'nosniff')
	return headers
}
