import { type SerializeFrom } from '@remix-run/node'
import { useRouteLoaderData } from '@remix-run/react'
import { type loader as rootLoader } from '~/root.tsx'

export function useRequestInfo() {
	const data = useRouteLoaderData('root') as SerializeFrom<typeof rootLoader>
	return data.requestInfo
}
