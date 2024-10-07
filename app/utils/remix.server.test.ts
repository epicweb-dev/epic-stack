import cacheControl from 'cache-control-parser'
import { describe, expect, test } from 'vitest'
import { getConservativeCacheControl } from './remix.server.ts'

describe('getConservativeCacheControl', () => {
	test('works for basic usecase', () => {
		const result = getConservativeCacheControl(
			'max-age=3600',
			'max-age=1800, s-maxage=600',
			'private, max-age=86400',
		)

		expect(result).toEqual(
			cacheControl.stringify({
				'max-age': 1800,
				's-maxage': 600,
				private: true,
			}),
		)
	})
	test('retains boolean directive', () => {
		const result = cacheControl.parse(
			getConservativeCacheControl('private', 'no-cache,no-store'),
		)

		expect(result.private).toEqual(true)
		expect(result['no-cache']).toEqual(true)
		expect(result['no-store']).toEqual(true)
	})
	test('gets smallest number directive', () => {
		const result = cacheControl.parse(
			getConservativeCacheControl(
				'max-age=10, s-maxage=300',
				'max-age=300, s-maxage=600',
			),
		)

		expect(result['max-age']).toEqual(10)
		expect(result['s-maxage']).toEqual(300)
	})
	test('lets unset directives remain unset', () => {
		const result = cacheControl.parse(
			getConservativeCacheControl(
				'max-age=3600',
				'max-age=1800, s-maxage=600',
				'private, max-age=86400',
			),
		)

		expect(result['must-revalidate']).toBeUndefined()
		expect(result['stale-while-revalidate']).toBeUndefined()
	})
})
