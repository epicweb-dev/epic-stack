import { helmet as _helmet } from './helmet'

const MODE = process.env.NODE_ENV ?? 'development'

export function helmet(options: {
	html: true
	nonce: string
	cors?: boolean
}): Headers
export function helmet(options?: { html?: false; cors?: boolean }): Headers
export function helmet({
	html = false,
	cors = false,
	nonce,
}: {
	html?: boolean
	cors?: boolean
	nonce?: string
} = {}) {
	return _helmet({
		html,
		cors,
		options: {
			referrerPolicy: ['same-origin'],
			crossOriginEmbedderPolicy: false,
			contentSecurityPolicy: {
				// NOTE: Remove reportOnly when you're ready to enforce this CSP
				reportOnly: true,
				directives: {
					fetch: {
						'connect-src': [
							MODE === 'development' ? 'ws:' : undefined,
							process.env.SENTRY_DSN ? '*.sentry.io' : undefined,
							"'self'",
						],
						'font-src': ["'self'"],
						'frame-src': ["'self'"],
						'img-src': ["'self'", 'data:'],
						'script-src': ["'strict-dynamic'", "'self'", `'nonce-${nonce}'`],
						'script-src-attr': [`'nonce-${nonce}'`],
					},
				},
			},
		},
	})
}
