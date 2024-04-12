import { invariant } from '@epic-web/invariant'
import { useRouteLoaderData } from '@remix-run/react'

import { type loader as rootLoader } from '#app/root.tsx'

/**
 * @returns the request info from the root loader
 */
export function useRequestInfo() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	invariant(data?.requestInfo, 'No requestInfo found in root loader')

	return data.requestInfo
}
