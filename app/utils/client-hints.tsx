/**
 * This file contains utilities for using client hints for user preference which
 * are needed by the server, but are only known by the browser.
 */
import { useRevalidator } from '@remix-run/react'
import * as React from 'react'
import { useRequestInfo } from './request-info.ts'

const clientHints = {
	theme: {
		cookieName: 'CH-prefers-color-scheme',
		getValueCode: `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`,
		fallback: 'light',
		transform(value: string) {
			return value === 'dark' ? 'dark' : 'light'
		},
	},
	timeZone: {
		cookieName: 'CH-time-zone',
		getValueCode: `Intl.DateTimeFormat().resolvedOptions().timeZone`,
		fallback: 'UTC',
	},
	// add other hints here
}

type ClientHintNames = keyof typeof clientHints

function getCookieValue(cookieString: string, name: ClientHintNames) {
	const hint = clientHints[name]
	if (!hint) {
		throw new Error(`Unknown client hint: ${name}`)
	}
	const value = cookieString
		.split(';')
		.map(c => c.trim())
		.find(c => c.startsWith(hint.cookieName + '='))
		?.split('=')[1]

	return value ? decodeURIComponent(value) : null
}

/**
 *
 * @param request {Request} - optional request object (only used on server)
 * @returns an object with the client hints and their values
 */
export function getHints(request?: Request) {
	const cookieString =
		typeof document !== 'undefined'
			? document.cookie
			: typeof request !== 'undefined'
			? request.headers.get('Cookie') ?? ''
			: ''

	return Object.entries(clientHints).reduce(
		(acc, [name, hint]) => {
			const hintName = name as ClientHintNames
			if ('transform' in hint) {
				acc[hintName] = hint.transform(
					getCookieValue(cookieString, hintName) ?? hint.fallback,
				)
			} else {
				// @ts-expect-error - this is fine (PRs welcome though)
				acc[hintName] = getCookieValue(cookieString, hintName) ?? hint.fallback
			}
			return acc
		},
		{} as {
			[name in ClientHintNames]: (typeof clientHints)[name] extends {
				transform: (value: any) => infer ReturnValue
			}
				? ReturnValue
				: (typeof clientHints)[name]['fallback']
		},
	)
}

/**
 * @returns an object with the client hints and their values
 */
export function useHints() {
	const requestInfo = useRequestInfo()
	return requestInfo.hints
}

/**
 * @returns inline script element that checks for client hints and sets cookies
 * if they are not set then reloads the page if any cookie was set to an
 * inaccurate value.
 */
export function ClientHintCheck({ nonce }: { nonce: string }) {
	const { revalidate } = useRevalidator()
	React.useEffect(() => {
		const themeQuery = window.matchMedia('(prefers-color-scheme: dark)')
		function handleThemeChange() {
			document.cookie = `${clientHints.theme.cookieName}=${
				themeQuery.matches ? 'dark' : 'light'
			}`
			revalidate()
		}
		themeQuery.addEventListener('change', handleThemeChange)
		return () => {
			themeQuery.removeEventListener('change', handleThemeChange)
		}
	}, [revalidate])

	return (
		<script
			nonce={nonce}
			dangerouslySetInnerHTML={{
				__html: `
const cookies = document.cookie.split(';').map(c => c.trim()).reduce((acc, cur) => {
	const [key, value] = cur.split('=');
	acc[key] = value;
	return acc;
}, {});
let cookieChanged = false;
const hints = [
${Object.values(clientHints)
	.map(hint => {
		const cookieName = JSON.stringify(hint.cookieName)
		return `{ name: ${cookieName}, actual: String(${hint.getValueCode}), cookie: cookies[${cookieName}] }`
	})
	.join(',\n')}
];
for (const hint of hints) {
	if (decodeURIComponent(hint.cookie) !== hint.actual) {
		cookieChanged = true;
		document.cookie = encodeURIComponent(hint.name) + '=' + encodeURIComponent(hint.actual) + ';path=/';
	}
}
// if the cookie changed, reload the page, unless the browser doesn't support
// cookies (in which case we would enter an infinite loop of reloads)
if (cookieChanged && navigator.cookieEnabled) {
	window.location.reload();
}
			`,
			}}
		/>
	)
}
