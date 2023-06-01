/**
 * based on https://github.com/faker-js/faker/issues/1785#issuecomment-1407773744
 * replace this code with memoize-unique when it is published
 */

export interface Store<T> {
	[key: string]: T
}

export interface MemoizeUniqueOptions<T> {
	/**
	 * The time in milliseconds this method may take before throwing an error.
	 *
	 * @default 50
	 */
	maxTime?: number

	/**
	 * The total number of attempts to try before throwing an error.
	 *
	 * @default 50
	 */
	maxRetries?: number

	/**
	 * The value or values that should be excluded.
	 *
	 * If the callback returns one of these values, it will be called again and the internal retries counter will be incremented.
	 *
	 * @default []
	 */
	exclude?: T | T[]

	/**
	 * The store of already fetched results.
	 *
	 * @default {}
	 */
	readonly store?: Store<T>
}

export type MemoizeUniqueReturn<
	T,
	U extends readonly any[] = readonly any[],
> = (...args: [...U]) => T

export function memoizeUnique<T, U extends readonly any[] = readonly any[]>(
	callback: MemoizeUniqueReturn<T, U>,
	options: MemoizeUniqueOptions<T> = {},
): MemoizeUniqueReturn<T, U> {
	const { maxTime = 50, maxRetries = 50, store = {} } = options
	let { exclude = [] } = options

	if (!Array.isArray(exclude)) {
		exclude = [exclude]
	}

	return (...args) => {
		let startTime = Date.now()
		let retries = 0

		let result: T

		do {
			if (Date.now() - startTime > maxTime) {
				throw new Error(
					`memoizeUnique: maxTime of ${maxTime}ms exceeded after ${retries} retries`,
				)
			}

			if (retries > maxRetries) {
				throw new Error(`memoizeUnique: maxRetries of ${maxRetries} exceeded`)
			}

			retries++

			result = callback(...args)

			if ((exclude as T[]).includes(result)) {
				continue
			}

			const key = JSON.stringify(args) + JSON.stringify(result)
			if (!store.hasOwnProperty(key)) {
				store[key] = result
				break
			}
		} while (true)

		return result
	}
}
