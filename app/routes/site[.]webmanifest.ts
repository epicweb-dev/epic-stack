import { APP_TITLE } from '#app/utils/branding.ts'
import { type Route } from './+types/site[.]webmanifest.ts'

const manifest = {
	name: APP_TITLE,
	short_name: APP_TITLE,
	start_url: '/',
	icons: [
		{
			src: '/favicons/android-chrome-192x192.png',
			sizes: '192x192',
			type: 'image/png',
		},
		{
			src: '/favicons/android-chrome-512x512.png',
			sizes: '512x512',
			type: 'image/png',
		},
	],
	theme_color: '#A9ADC1',
	background_color: '#1f2028',
	display: 'standalone',
} as const

export function loader(_: Route.LoaderArgs) {
	return new Response(JSON.stringify(manifest), {
		headers: {
			'Content-Type': 'application/manifest+json',
			'Cache-Control': 'public, max-age=3600',
		},
	})
}
