import { expect, test } from 'vitest'
import {
	isExpectedReactRouterErrorMessage,
	isHealthcheckTransaction,
	shouldDropErrorEvent,
} from './sentry-event-filters.ts'

test('detects missing action / loader / invalid method router errors', () => {
	expect(
		isExpectedReactRouterErrorMessage(
			'You made a POST request to "/" but did not provide an `action` for route "root", so there is no way to handle the request.',
		),
	).toBe(true)
	expect(
		isExpectedReactRouterErrorMessage(
			'You made a GET request to "/resources/theme-switch" but did not provide a `loader` for route "routes/resources/theme-switch", so there is no way to handle the request.',
		),
	).toBe(true)
	expect(
		isExpectedReactRouterErrorMessage('Invalid request method "OPTIONS"'),
	).toBe(true)
	expect(isExpectedReactRouterErrorMessage('Database connection failed')).toBe(
		false,
	)
})

test('shouldDropErrorEvent reads exception values', () => {
	expect(
		shouldDropErrorEvent({
			exception: {
				values: [
					{
						value:
							'You made a POST request to "/" but did not provide an `action` for route "root", so there is no way to handle the request.',
					},
				],
			},
		}),
	).toBe(true)
	expect(
		shouldDropErrorEvent({
			exception: { values: [{ value: 'Unexpected server failure' }] },
		}),
	).toBe(false)
})

test('isHealthcheckTransaction matches url, header, and orphaned prisma dsc', () => {
	expect(
		isHealthcheckTransaction({
			request: { url: 'http://127.0.0.1:8080/resources/healthcheck' },
		}),
	).toBe(true)
	expect(
		isHealthcheckTransaction({
			request: { headers: { 'x-healthcheck': 'true' } },
		}),
	).toBe(true)
	expect(
		isHealthcheckTransaction({
			transaction: 'prisma:client:operation',
			tags: { url: 'http://172.19.14.2:8080/resources/healthcheck' },
			contexts: {
				trace: {
					data: {
						'sentry.dsc.transaction': 'GET /resources/healthcheck',
					},
				},
			},
		}),
	).toBe(true)
	expect(
		isHealthcheckTransaction({
			transaction: 'GET /users',
			request: { url: 'https://example.com/users' },
		}),
	).toBe(false)
})
