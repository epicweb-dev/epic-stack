import { RemixBrowser } from '@remix-run/react'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'development') {
	import('~/utils/devtools.tsx').then(({ init }) => init())
}
if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('~/utils/monitoring.client.tsx').then(({ init }) => init())
}
const callback = () =>
	startTransition(() => {
		hydrateRoot(document, <RemixBrowser />)
	})
if (process.env.NODE_ENV === 'development') {
	import('remix-development-tools').then(({ initClient }) => {
		initClient()
		callback()
	})
} else {
	callback()
}
