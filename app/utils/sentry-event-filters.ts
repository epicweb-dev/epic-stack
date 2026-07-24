/**
 * Pure helpers for dropping expected Sentry noise from the public Epic Stack
 * demo (bots, scanners, Fly healthchecks) without hiding real application bugs.
 */

const EXPECTED_REACT_ROUTER_ERROR_PATTERNS = [
	/did not provide an `action`/i,
	/did not provide a `loader`/i,
	/^Invalid request method /i,
]

export function isExpectedReactRouterErrorMessage(message: string): boolean {
	return EXPECTED_REACT_ROUTER_ERROR_PATTERNS.some((pattern) =>
		pattern.test(message),
	)
}

export function getEventErrorMessages(event: {
	message?: string
	exception?: { values?: Array<{ value?: string | null } | null> | null }
}): string[] {
	const messages: string[] = []
	for (const value of event.exception?.values ?? []) {
		if (value?.value) messages.push(value.value)
	}
	if (event.message) messages.push(event.message)
	return messages
}

export function shouldDropErrorEvent(event: {
	message?: string
	exception?: { values?: Array<{ value?: string | null } | null> | null }
}): boolean {
	return getEventErrorMessages(event).some(isExpectedReactRouterErrorMessage)
}

type TransactionLike = {
	transaction?: string | null
	request?: {
		url?: string | null
		headers?: Record<string, string> | null
	} | null
	tags?: Record<string, unknown> | null
	contexts?: {
		trace?: {
			data?: Record<string, unknown> | null
		} | null
	} | null
}

function includesHealthcheckPath(value: string): boolean {
	return value.includes('/resources/healthcheck')
}

export function isHealthcheckTransaction(event: TransactionLike): boolean {
	if (event.request?.headers?.['x-healthcheck'] === 'true') {
		return true
	}

	const candidates = [
		event.request?.url,
		event.transaction,
		typeof event.tags?.url === 'string' ? event.tags.url : null,
		typeof event.contexts?.trace?.data?.['sentry.dsc.transaction'] === 'string'
			? event.contexts.trace.data['sentry.dsc.transaction']
			: null,
	]

	return candidates.some(
		(value) => typeof value === 'string' && includesHealthcheckPath(value),
	)
}
