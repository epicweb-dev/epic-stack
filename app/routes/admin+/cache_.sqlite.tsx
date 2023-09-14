import { type DataFunctionArgs, json, redirect } from '@remix-run/node'
import { getInstanceInfo, getInternalInstanceDomain } from 'litefs-js'
import { z } from 'zod'
import { cache } from '#app/utils/cache.server.ts'

export async function action({ request }: DataFunctionArgs) {
	const { currentIsPrimary, primaryInstance } = await getInstanceInfo()
	if (!currentIsPrimary) {
		throw new Error(
			`${request.url} should only be called on the primary instance (${primaryInstance})}`,
		)
	}
	const token = process.env.INTERNAL_COMMAND_TOKEN
	const isAuthorized =
		request.headers.get('Authorization') === `Bearer ${token}`
	if (!isAuthorized) {
		// nah, you can't be here...
		return redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
	}
	const { key, cacheValue } = z
		.object({ key: z.string(), cacheValue: z.unknown().optional() })
		.parse(await request.json())
	if (cacheValue === undefined) {
		await cache.delete(key)
	} else {
		// @ts-expect-error - we don't reliably know the type of cacheValue
		await cache.set(key, cacheValue)
	}
	return json({ success: true })
}

export async function updatePrimaryCacheValue({
	key,
	cacheValue,
}: {
	key: string
	cacheValue: any
}) {
	const { currentIsPrimary, primaryInstance } = await getInstanceInfo()
	if (currentIsPrimary) {
		throw new Error(
			`updatePrimaryCacheValue should not be called on the primary instance (${primaryInstance})}`,
		)
	}
	const domain = getInternalInstanceDomain(primaryInstance)
	const token = process.env.INTERNAL_COMMAND_TOKEN
	return fetch(`${domain}/admin/cache/sqlite`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ key, cacheValue }),
	})
}
