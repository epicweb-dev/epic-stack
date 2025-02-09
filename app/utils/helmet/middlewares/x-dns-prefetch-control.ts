export const xDnsPrefetchControl = (
	options: XDnsPrefetchControlOptions = 'off',
): Headers => {
	const headers = new Headers()
	headers.set('X-DNS-Prefetch-Control', options)
	return headers
}

export type XDnsPrefetchControlOptions = XDnsPrefetchControlDirective
export type XDnsPrefetchControlDirective = 'on' | 'off'
