import { useRouteLoaderData } from '@remix-run/react'
import { HoneypotInputs } from 'remix-utils'
import { loader as rootLoader } from '#app/root.tsx'

export function HoneypotFields() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	if (!data) return null
	return <HoneypotInputs {...data.honeypot} />
}
