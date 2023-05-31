import { RemixBrowser } from '@remix-run/react'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'development') {
	import('~/utils/devtools.tsx').then(({ init }) => init())
}
if (ENV.MODE === 'production') { 
	import('~/utils/monitoring.client.tsx').then(({ init }) => init())
}
startTransition(() => {
	hydrateRoot(document, <RemixBrowser />)
})
