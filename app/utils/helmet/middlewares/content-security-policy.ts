import { type SmartString } from '#app/utils/misc.ts'

export const contentSecurityPolicy = (
	options?: ContentSecurityPolicyOptions,
): Headers => {
	const headers = new Headers()
	const { useDefaults = true, reportOnly = false, directives } = options ?? {}
	const rawDirectives = useDefaults
		? defaultizeDirectives(directives)
		: directives

	if (!rawDirectives) {
		return headers
	}

	const policy: string[] = []
	if (rawDirectives.fetch) {
		for (const [directive, value] of Object.entries(rawDirectives.fetch)) {
			policy.push(
				`${directive} ${value === "'none'" ? value : value.filter(Boolean).join(' ')}`,
			)
		}
	}

	if (rawDirectives.document) {
		const { ['base-uri']: baseUri, sandbox } = rawDirectives.document
		if (baseUri) {
			policy.push(
				`base-uri ${baseUri === "'none'" ? baseUri : baseUri.filter(Boolean).join(' ')}`,
			)
		}
		if (sandbox) {
			policy.push(`sandbox ${sandbox}`)
		}
	}

	if (rawDirectives.navigation) {
		const { ['form-action']: formAction, ['frame-ancestors']: frameAncestors } =
			rawDirectives.navigation

		if (formAction) {
			policy.push(
				`form-action ${formAction === "'none'" ? formAction : formAction.filter(Boolean).join(' ')}`,
			)
		}
		if (frameAncestors) {
			policy.push(
				`frame-ancestors ${frameAncestors === "'none'" ? frameAncestors : frameAncestors.filter(Boolean).join(' ')}`,
			)
		}
	}

	if (rawDirectives.reporting) {
		const { ['report-to']: reportTo } = rawDirectives.reporting
		if (reportTo) {
			policy.push(`report-to ${reportTo}`)
		}
	}

	if (rawDirectives.other) {
		const {
			['require-trusted-types-for']: requireTrustedTypesFor,
			['trusted-types']: trustedTypes,
			['upgrade-insecure-requests']: upgradeInsecureRequests,
		} = rawDirectives.other

		if (requireTrustedTypesFor) {
			policy.push(`require-trusted-types-for ${requireTrustedTypesFor}`)
		}

		if (trustedTypes) {
			policy.push(
				`trusted-types ${trustedTypes === "'none'" ? trustedTypes : trustedTypes.filter(Boolean).join(' ')}`,
			)
		}

		if (upgradeInsecureRequests) {
			policy.push('upgrade-insecure-requests')
		}
	}

	if (rawDirectives.deprecated) {
		const {
			['block-all-mixed-content']: blockAllMixedContent,
			['report-uri']: reportUri,
		} = rawDirectives.deprecated

		if (blockAllMixedContent) {
			policy.push('block-all-mixed-content')
		}

		if (reportUri) {
			policy.push(`report-uri ${reportUri}`)
		}
	}

	headers.set(
		reportOnly
			? 'Content-Security-Policy-Report-Only'
			: 'Content-Security-Policy',
		policy.join(';'),
	)
	return headers
}

export type ContentSecurityPolicyOptions = {
	useDefaults?: boolean
	reportOnly?: boolean
	directives?: DirectiveOptions
}

type DirectiveOptions = {
	fetch?: FetchDirectiveOptions
	document?: DocumentDirectiveOptions
	navigation?: NavigationDirectiveOptions
	reporting?: ReportingDirectiveOptions
	other?: OtherDirectiveOptions
	deprecated?: DeprecatedDirectiveOptions
}

type FetchDirectiveOptions = {
	[key in
		| 'child-src'
		| 'connect-src'
		| 'default-src'
		| 'fenced-frame-src'
		| 'font-src'
		| 'frame-src'
		| 'img-src'
		| 'manifest-src'
		| 'media-src'
		| 'object-src'
		| 'prefetch-src'
		| 'script-src'
		| 'script-src-elem'
		| 'script-src-attr'
		| 'style-src'
		| 'style-src-elem'
		| 'style-src-attr'
		| 'worker-src']?: FetchDirectiveSyntax
}

type DocumentDirectiveOptions = {
	'base-uri'?: "'none'" | SourceExpressionList
	sandbox?: SandboxSyntax
}

type NavigationDirectiveOptions = {
	'form-action'?: "'none'" | SourceExpressionList
	'frame-ancestors'?: "'none'" | SourceExpressionList
}

type ReportingDirectiveOptions = {
	'report-to'?: string
}

type OtherDirectiveOptions = {
	'require-trusted-types-for'?: 'script'
	'trusted-types'?: "'none'" | Array<SmartString | 'allow-duplicates'>
	'upgrade-insecure-requests'?: boolean
}

type DeprecatedDirectiveOptions = {
	'block-all-mixed-content'?: boolean
	'report-uri'?: string
}

type SourceExpression = "'self'" | HostSource | SchemeSource | undefined
type SourceExpressionList = Array<SourceExpression>
type HostSource = SmartString
type SchemeSource = `${Protocol}:`
type Protocol =
	| 'blob'
	| 'data'
	| 'file'
	| 'ftp'
	| 'http'
	| 'https'
	| 'javascript'
	| 'mailto'
	| 'resource '
	| 'ssh'
	| 'tel'
	| 'urn'
	| 'view-source'
	| 'ws'
	| 'wss'

type FetchDirectiveSyntax =
	| "'none'"
	| Array<
			| "'unsafe-eval'"
			| "'wasm-unsafe-eval'"
			| "'unsafe-inline'"
			| "'unsafe-hashes'"
			| "'inline-speculation-rules'"
			| "'strict-dynamic'"
			| "'report-sample'"
			| `'nonce-${string}'`
			| `'${'sha256' | 'sha384' | 'sha512'}-${string}'`
			| SourceExpression
			| SmartString
	  >

type SandboxSyntax =
	| 'allow-downloads'
	| 'allow-forms'
	| 'allow-modals'
	| 'allow-orientation-lock'
	| 'allow-pointer-lock'
	| 'allow-popups'
	| 'allow-popups-to-escape-sandbox'
	| 'allow-presentation'
	| 'allow-same-origin'
	| 'allow-scripts'
	| 'allow-storage-access-by-user-activation Experimental'
	| 'allow-top-navigation'
	| 'allow-top-navigation-by-user-activation'
	| 'allow-top-navigation-to-custom-protocols'

function defaultizeDirectives(directives?: DirectiveOptions): DirectiveOptions {
	if (!directives) {
		return defaultDirectives
	}

	return {
		fetch: {
			...defaultDirectives.fetch,
			...directives.fetch,
		},
		document: {
			...defaultDirectives.document,
			...directives.document,
		},
		navigation: {
			...defaultDirectives.navigation,
			...directives.navigation,
		},
		reporting: {
			...defaultDirectives.reporting,
			...directives.reporting,
		},
		other: {
			...defaultDirectives.other,
			...directives.other,
		},
		deprecated: {
			...defaultDirectives.deprecated,
			...directives.deprecated,
		},
	}
}

const defaultDirectives: DirectiveOptions = {
	fetch: {
		'default-src': ["'self'"],
		'font-src': ["'self'", 'https:', 'data:'],
		'img-src': ["'self'", 'data:'],
		'object-src': ["'none'"],
		'script-src': ["'self'"],
		'script-src-attr': ["'none'"],
		'style-src': ["'self'", 'https:', "'unsafe-inline'"],
	},
	document: {
		'base-uri': ["'self'"],
	},

	navigation: {
		'form-action': ["'self'"],
		'frame-ancestors': ["'self'"],
	},
	other: {
		'upgrade-insecure-requests': false,
	},
}
