import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function getUserImgSrc(imageId?: string | null) {
	return imageId ? `/resources/file/${imageId}` : `/img/user.png`
}

export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getDomainUrl(request: Request) {
	const host =
		request.headers.get('X-Forwarded-Host') ?? request.headers.get('host')
	if (!host) {
		throw new Error('Could not determine domain URL.')
	}
	const protocol = host.includes('localhost') ? 'http' : 'https'
	return `${protocol}://${host}`
}

/**
 * Merge multiple headers objects into one (uses set so headers are overridden)
 */
export function mergeHeaders(...headers: Array<ResponseInit['headers']>) {
	const merged = new Headers()
	for (const header of headers) {
		for (const [key, value] of new Headers(header).entries()) {
			merged.set(key, value)
		}
	}
	return merged
}

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(...headers: Array<ResponseInit['headers']>) {
	const combined = new Headers()
	for (const header of headers) {
		for (const [key, value] of new Headers(header).entries()) {
			combined.append(key, value)
		}
	}
	return combined
}
