import type { DataFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { getAllInstances, getInstanceInfo } from 'litefs-js'
import { ensureInstance } from 'litefs-js/remix.js'
import { lruCache } from '~/utils/cache.server.ts'
import { invariantResponse } from '~/utils/misc.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	await requireAdmin(request)
	const searchParams = new URL(request.url).searchParams
	const currentInstanceInfo = await getInstanceInfo()
	const allInstances = await getAllInstances()
	const instance =
		searchParams.get('instance') ?? currentInstanceInfo.currentInstance
	await ensureInstance(instance)

	const { cacheKey } = params
	invariantResponse(cacheKey, 'cacheKey is required')
	return json({
		instance: {
			hostname: instance,
			region: allInstances[instance],
			isPrimary: currentInstanceInfo.primaryInstance === instance,
		},
		cacheKey,
		value: lruCache.get(cacheKey),
	})
}
