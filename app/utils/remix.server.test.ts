import { format, parse } from '@tusbar/cache-control'
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
			format({
				maxAge: 1800,
				sharedMaxAge: 600,
				private: true,
			}),
		)
	})
	test('retains boolean directive', () => {
		const result = parse(
			getConservativeCacheControl('private', 'no-cache,no-store'),
		)

		expect(result.private).toEqual(true)
		expect(result.noCache).toEqual(true)
		expect(result.noStore).toEqual(true)
	})
	test('gets smallest number directive', () => {
		const result = parse(
			getConservativeCacheControl(
				'max-age=10, s-maxage=300',
				'max-age=300, s-maxage=600',
			),
		)

		expect(result.maxAge).toEqual(10)
		expect(result.sharedMaxAge).toEqual(300)
	})
})
