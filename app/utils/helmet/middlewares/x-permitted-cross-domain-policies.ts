export const xPermittedCrossDomainPolicies = (
	options: XPermittedCrossDomainPoliciesOptions = 'none',
): Headers => {
	const headers = new Headers()
	headers.set('X-Permitted-Cross-Domain-Policies', options)
	return headers
}

export type XPermittedCrossDomainPoliciesOptions =
	XPermittedCrossDomainPoliciesDirective
export type XPermittedCrossDomainPoliciesDirective =
	| 'none'
	| 'master-only'
	| 'by-content-type'
	| 'by-ftp-filename'
	| 'all'
	| 'none-this-response'
