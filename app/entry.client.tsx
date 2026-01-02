import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'
import { init } from './utils/monitoring.client.tsx'

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	init()
}

startTransition(() => {
	hydrateRoot(document, <HydratedRouter />)
})
