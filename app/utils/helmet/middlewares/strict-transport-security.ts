export const strictTransportSecurity = ({
	maxAge = 365 * 24 * 60 * 60,
	includeSubDomains = true,
	preload = false,
}: StrictTransportSecurityOptions = {}): Headers => {
	const headers = new Headers()
	const directives = [`max-age=${maxAge}`]
	if (includeSubDomains) directives.push('includeSubDomains')
	if (preload) directives.push('preload')

	headers.set('Strict-Transport-Security', directives.join(';'))
	return headers
}

export type StrictTransportSecurityOptions = {
	maxAge?: number
	includeSubDomains?: boolean
	preload?: boolean
}
