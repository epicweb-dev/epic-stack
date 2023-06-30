import { useOutlet } from '@remix-run/react'
import { type ClassValue, clsx } from 'clsx'
import { useState } from 'react'
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

/**
 * Provide a condition and if that condition is falsey, this throws an error
 * with the given message.
 *
 * inspired by invariant from 'tiny-invariant' except will still include the
 * message in production.
 *
 * @example
 * invariant(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw (or a callback to generate the message)
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Error} if condition is falsey
 */
export function invariant(
	condition: any,
	message: string | (() => string),
): asserts condition {
	if (!condition) {
		throw new Error(typeof message === 'function' ? message() : message)
	}
}

/**
 * Provide a condition and if that condition is falsey, this throws a 400
 * Response with the given message.
 *
 * inspired by invariant from 'tiny-invariant'
 *
 * @example
 * invariantResponse(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw (or a callback to generate the message)
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Response} if condition is falsey
 */
export function invariantResponse(
	condition: any,
	message: string | (() => string),
	responseInit?: ResponseInit,
): asserts condition {
	if (!condition) {
		throw new Response(typeof message === 'function' ? message() : message, {
			status: 400,
			...responseInit,
		})
	}
}

export function AnimatedOutlet() {
	const [outlet] = useState(useOutlet())

	return outlet
}
