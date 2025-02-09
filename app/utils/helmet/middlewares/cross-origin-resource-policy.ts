export const crossOriginResourcePolicy = (
	options: CrossOriginResourcePolicyOptions = 'same-origin',
): Headers => {
	const headers = new Headers()
	headers.set('Cross-Origin-Resource-Policy', options)
	return headers
}

export type CrossOriginResourcePolicyOptions =
	CrossOriginResourcePolicyDirective
export type CrossOriginResourcePolicyDirective =
	| 'same-site'
	| 'same-origin'
	| 'cross-origin'
