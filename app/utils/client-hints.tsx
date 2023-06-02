/**
 * This file contains utilities for using client hints for user preference which
 * are needed by the server, but are only known by the browser.
 */

import { useRequestInfo } from './request-info.ts'

export const colorSchemeHint = {
	name: 'theme',
	cookieName: 'CH-prefers-color-scheme',
	getValueCode: `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`,
	fallback: 'light',
	transform(value: any) {
		return value === 'dark' ? 'dark' : 'light'
	},
	// "as const" is necessary for inference to work.
	// PRs welcome to improve the typings for all this.
} as const

const clientHints = [
	colorSchemeHint,
	// add other hints here
] as const

type ClientHintNames = (typeof clientHints)[number]['name']

function getCookieValue(cookieString: string, name: ClientHintNames) {
	const hint = clientHints.find(hint => hint.name === name)
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
	return clientHints.reduce(
		(acc, hint) => {
			acc[hint.name] = hint.transform(getCookieValue(cookieString, hint.name))
			return acc
		},
		{} as {
			[name in ClientHintNames]: ReturnType<
				(typeof clientHints)[number]['transform']
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
${clientHints
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
