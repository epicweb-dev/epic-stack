export const xXssProtection = (): Headers => {
	const headers = new Headers()
	headers.set('X-XSS-Protection', '0')
	return headers
}
