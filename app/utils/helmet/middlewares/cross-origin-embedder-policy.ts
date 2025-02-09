export const crossOriginEmbedderPolicy = (
	options: CrossOriginEmbedderPolicyOptions = 'require-corp',
): Headers => {
	const headers = new Headers()
	headers.set('Cross-Origin-Embedder-Policy', options)
	return headers
}

export type CrossOriginEmbedderPolicyOptions =
	CrossOriginEmbedderPolicyDirective
export type CrossOriginEmbedderPolicyDirective =
	| 'unsafe-none'
	| 'require-corp'
	| 'credentialless'
