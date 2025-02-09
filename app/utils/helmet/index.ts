import { combineHeaders } from '../misc.tsx'
import {
	contentSecurityPolicy,
	type ContentSecurityPolicyOptions,
	crossOriginEmbedderPolicy,
	type CrossOriginEmbedderPolicyOptions,
	crossOriginOpenerPolicy,
	type CrossOriginOpenerPolicyOptions,
	crossOriginResourcePolicy,
	type CrossOriginResourcePolicyOptions,
	referrerPolicy,
	type ReferrerPolicyOptions,
	strictTransportSecurity,
	type StrictTransportSecurityOptions,
	xDnsPrefetchControl,
	type XDnsPrefetchControlOptions,
	xFrameOptions,
	type XFrameOptionsOptions,
	xPermittedCrossDomainPolicies,
	type XPermittedCrossDomainPoliciesOptions,
	xXssProtection,
	originAgentCluster,
	xContentTypeOptions,
	xDownloadOptions,
} from './middlewares/index.ts'

export function helmet({
	options,
	html = true,
	cors = false,
}: HelmetOptions): Headers {
	let headers = new Headers()
	switch (options.crossOriginResourcePolicy) {
		case undefined:
		case true:
			headers = combineHeaders(
				headers,
				crossOriginResourcePolicy(cors ? 'cross-origin' : 'same-origin'),
			)
			break
		case false:
			break
		default:
			headers = combineHeaders(
				headers,
				crossOriginResourcePolicy(options.crossOriginResourcePolicy),
			)
	}

	switch (options.crossOriginEmbedderPolicy) {
		case undefined:
		case true:
			headers = combineHeaders(headers, crossOriginEmbedderPolicy())
			break
		case false:
			break
		default:
			headers = combineHeaders(
				headers,
				crossOriginEmbedderPolicy(options.crossOriginEmbedderPolicy),
			)
	}

	if (options.originAgentCluster ?? true) {
		headers = combineHeaders(headers, originAgentCluster())
	}

	switch (options.referrerPolicy) {
		case undefined:
		case true:
			headers = combineHeaders(headers, referrerPolicy())
			break
		case false:
			break
		default:
			headers = combineHeaders(headers, referrerPolicy(options.referrerPolicy))
	}

	switch (options.strictTransportSecurity) {
		case undefined:
		case true:
			headers = combineHeaders(headers, strictTransportSecurity())
			break
		case false:
			break
		default:
			headers = combineHeaders(
				headers,
				strictTransportSecurity(options.strictTransportSecurity),
			)
	}

	if (options.xContentTypeOptions ?? true) {
		headers = combineHeaders(headers, xContentTypeOptions())
	}

	switch (options.xDnsPrefetchControl) {
		case undefined:
		case true:
			headers = combineHeaders(headers, xDnsPrefetchControl())
			break
		case false:
			break
		default:
			headers = combineHeaders(
				headers,
				xDnsPrefetchControl(options.xDnsPrefetchControl),
			)
	}

	switch (options.xPermittedCrossDomainPolicies) {
		case undefined:
		case true:
			headers = combineHeaders(headers, xPermittedCrossDomainPolicies())
			break
		case false:
			break
		default:
			headers = combineHeaders(
				headers,
				xPermittedCrossDomainPolicies(options.xPermittedCrossDomainPolicies),
			)
	}

	if (options.xXssProtection ?? true) {
		headers = combineHeaders(headers, xXssProtection())
	}

	if (html) {
		switch (options.contentSecurityPolicy) {
			case undefined:
			case true:
				headers = combineHeaders(headers, contentSecurityPolicy())
				break
			case false:
				break
			default:
				headers = combineHeaders(
					headers,
					contentSecurityPolicy(options.contentSecurityPolicy),
				)
		}

		switch (options.crossOriginOpenerPolicy) {
			case undefined:
			case true:
				headers = combineHeaders(headers, crossOriginOpenerPolicy())
				break
			case false:
				break
			default:
				headers = combineHeaders(
					headers,
					crossOriginOpenerPolicy(options.crossOriginOpenerPolicy),
				)
		}

		if (options.xDownloadOptions ?? true) {
			headers = combineHeaders(headers, xDownloadOptions())
		}

		switch (options.xFrameOptions) {
			case undefined:
			case true:
				headers = combineHeaders(headers, xFrameOptions())
				break
			case false:
				break
			default:
				headers = combineHeaders(headers, xFrameOptions(options.xFrameOptions))
		}
	}

	return headers
}

export type HelmetOptions = {
	options: SecureOptions
	html?: boolean
	cors?: boolean
}

export type SecureOptions = GeneralSecureOptions & HtmlSpecificSecureOptions

type GeneralSecureOptions = {
	crossOriginResourcePolicy?: CrossOriginResourcePolicyOptions | boolean
	crossOriginEmbedderPolicy?: CrossOriginEmbedderPolicyOptions | boolean
	originAgentCluster?: boolean
	referrerPolicy?: ReferrerPolicyOptions | boolean
	strictTransportSecurity?: StrictTransportSecurityOptions | boolean
	xContentTypeOptions?: boolean
	xDnsPrefetchControl?: XDnsPrefetchControlOptions | boolean
	xPermittedCrossDomainPolicies?: XPermittedCrossDomainPoliciesOptions | boolean
	xXssProtection?: boolean
}

type HtmlSpecificSecureOptions = {
	contentSecurityPolicy?: ContentSecurityPolicyOptions | boolean
	crossOriginOpenerPolicy?: CrossOriginOpenerPolicyOptions | boolean
	xDownloadOptions?: boolean
	xFrameOptions?: XFrameOptionsOptions | boolean
}
