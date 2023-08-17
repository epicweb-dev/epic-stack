import { RemixBrowser } from '@remix-run/react'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('./utils/monitoring.client.tsx').then(({ init }) => init())
}

const callback = () =>
	startTransition(() => {
		hydrateRoot(document, <RemixBrowser />)
	})

if (process.env.NODE_ENV === 'development') {
	import('remix-development-tools').then(({ initClient }) => {
		// Add all the dev tools props here into the client
		initClient()
		callback()
	})
} else {
	callback()
}
