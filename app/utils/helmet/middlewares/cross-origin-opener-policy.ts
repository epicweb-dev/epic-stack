export const crossOriginOpenerPolicy = (
	options: CrossOriginOpenerPolicyOptions = 'same-origin',
): Headers => {
	const headers = new Headers()
	headers.set('Cross-Origin-Opener-Policy', options)
	return headers
}

export type CrossOriginOpenerPolicyOptions = CrossOriginOpenerPolicyDirective
export type CrossOriginOpenerPolicyDirective =
	| 'unsafe-none'
	| 'same-origin'
	| 'same-origin-allow-popups'
	| 'noopener-allow-popups'
