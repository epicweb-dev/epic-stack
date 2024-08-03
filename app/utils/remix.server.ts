import { type CacheControlValue, parse, format } from '@tusbar/cache-control'
import { type HeadersArgs } from 'react-router'

export function pipeHeaders({
	parentHeaders,
	loaderHeaders,
	actionHeaders,
	errorHeaders,
}: HeadersArgs) {
	const headers = new Headers()

	// get the one that's actually in use
	let currentHeaders: Headers
	if (errorHeaders !== undefined) {
		currentHeaders = errorHeaders
	} else if (loaderHeaders.entries().next().done) {
		currentHeaders = actionHeaders
	} else {
		currentHeaders = loaderHeaders
	}

	// take in useful headers route loader/action
	// pass this point currentHeaders can be ignored
	const forwardHeaders = ['Cache-Control', 'Vary', 'Server-Timing']
	for (const headerName of forwardHeaders) {
		const header = currentHeaders.get(headerName)
		if (header) {
			headers.set(headerName, header)
		}
	}

	headers.set(
		'Cache-Control',
		getConservativeCacheControl(
			parentHeaders.get('Cache-Control'),
			headers.get('Cache-Control'),
		),
	)

	// append useful parent headers
	const inheritHeaders = ['Vary', 'Server-Timing']
	for (const headerName of inheritHeaders) {
		const header = parentHeaders.get(headerName)
		if (header) {
			headers.append(headerName, header)
		}
	}

	// fallback to parent headers if loader don't have
	const fallbackHeaders = ['Cache-Control', 'Vary']
	for (const headerName of fallbackHeaders) {
		if (headers.has(headerName)) {
			continue
		}
		const fallbackHeader = parentHeaders.get(headerName)
		if (fallbackHeader) {
			headers.set(headerName, fallbackHeader)
		}
	}

	return headers
}

export function getConservativeCacheControl(
	...cacheControlHeaders: Array<string | null>
): string {
	return format(
		cacheControlHeaders
			.filter(Boolean)
			.map((header) => parse(header))
			.reduce<CacheControlValue>((acc, current) => {
				for (const key in current) {
					const directive = key as keyof Required<CacheControlValue> // keyof CacheControl includes functions

					const currentValue = current[directive]

					switch (typeof currentValue) {
						case 'boolean': {
							if (currentValue) {
								acc[directive] = true as any
							}

							break
						}
						case 'number': {
							const accValue = acc[directive] as number | undefined

							if (accValue === undefined) {
								acc[directive] = currentValue as any
							} else {
								const result = Math.min(accValue, currentValue)
								acc[directive] = result as any
							}

							break
						}
					}
				}

				return acc
			}, {}),
	)
}
