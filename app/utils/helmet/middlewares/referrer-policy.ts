export const referrerPolicy = (
	options: ReferrerPolicyOptions = ['no-referrer'],
): Headers => {
	const headers = new Headers()
	headers.set('Referrer-Policy', options.join(','))
	return headers
}

export type ReferrerPolicyOptions = ReferrerPolicyDirective[]
export type ReferrerPolicyDirective =
	| 'no-referrer'
	| 'no-referrer-when-downgrade'
	| 'origin'
	| 'origin-when-cross-origin'
	| 'same-origin'
	| 'strict-origin'
	| 'strict-origin-when-cross-origin (default)'
	| 'unsafe-url'
