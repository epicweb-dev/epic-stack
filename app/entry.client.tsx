import { RemixBrowser } from '@remix-run/react'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'development') {
	import('~/utils/devtools.tsx').then(({ init }) => init())
}
if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('~/utils/monitoring.client.tsx').then(({ init }) => init())
}
if (process.env.NODE_ENV === 'development') {
	import('remix-development-tools').then(({ initRouteBoundariesClient }) => {
		initRouteBoundariesClient()
		startTransition(() => {
			hydrateRoot(document, <RemixBrowser />)
		})
	})
} else {
	startTransition(() => {
		hydrateRoot(document, <RemixBrowser />)
	})
}
