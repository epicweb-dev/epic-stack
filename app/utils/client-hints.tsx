/**
 * This file contains utilities for using client hints for user preference which
 * are needed by the server, but are only known by the browser.
 */
import * as React from 'react'
import { useRequestInfo } from './request-info.ts'

export const clientHints = {
	theme: {
		cookieName: 'CH-prefers-color-scheme',
		getValueCode: `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`,
		fallback: 'light',
		transform(value: string | null) {
			return value === 'dark' ? 'dark' : 'light'
		},
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

	return value ?? null
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
			// using ignore because it's not an issue with only one hint, but will
			// be with more than one...
			// @ts-ignore PR to improve these types is welcome
			acc[hintName] = hint.transform(getCookieValue(cookieString, hintName))
			return acc
		},
		{} as {
			[name in ClientHintNames]: ReturnType<
				(typeof clientHints)[name]['transform']
			>
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
	React.useEffect(() => {
		const themeQuery = window.matchMedia('(prefers-color-scheme: dark)')
		function handleThemeChange() {
			document.cookie = `${clientHints.theme.cookieName}=${
				themeQuery.matches ? 'dark' : 'light'
			}`
		}
		themeQuery.addEventListener('change', handleThemeChange)
		return () => {
			themeQuery.removeEventListener('change', handleThemeChange)
		}
	}, [])

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
	if (hint.cookie !== hint.actual) {
		cookieChanged = true;
		document.cookie = hint.name + '=' + hint.actual;
	}
}
if (cookieChanged) {
	window.location.reload();
}
			`,
			}}
		/>
	)
}
