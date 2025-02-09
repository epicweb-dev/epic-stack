export const xFrameOptions = (
	options: XFrameOptionsOptions = 'SAMEORIGIN',
): Headers => {
	const headers = new Headers()
	headers.set('X-Frame-Options', options)
	return headers
}

export type XFrameOptionsOptions = XFrameOptionsDirective
export type XFrameOptionsDirective = 'DENY' | 'SAMEORIGIN'
