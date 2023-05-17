import { type Request } from '@remix-run/node'

const colorSchemeHint = {
	name: 'CH-prefers-color-scheme',
	getValueCode: `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`,
	fallback: 'light',
	transform(value: any) {
		return value === 'dark' ? 'dark' : 'light'
	},
} as const

const clockOffsetHint = {
	name: 'CH-clock-offset',
	getValueCode: `new Date().getTimezoneOffset() * -1`,
	fallback: '0',
	transform(value: any) {
		return !isNaN(Number(value)) ? Number(value) : 0
	},
} as const

const clientHints = [colorSchemeHint, clockOffsetHint] as const

type ClientHintNames = (typeof clientHints)[number]['name']

function getCookieValue(cookieString: string, name: ClientHintNames) {
	const hint = clientHints.find(hint => hint.name === name)
	if (!hint) {
		throw new Error(`Unknown client hint: ${name}`)
	}
	const value = cookieString
		.split(';')
		.map(c => c.trim())
		.find(c => c.startsWith(name + '='))
		?.split('=')[1]

	return value ?? null
}

function getCookieString(request?: Request) {
	return typeof document !== 'undefined'
		? document.cookie
		: typeof request !== 'undefined'
		? request.headers.get('Cookie') ?? ''
		: ''
}

/**
 *
 * @param request {Request} - optional request object (only used on server)
 * @returns the theme value of "light" or "dark"
 */
export function getThemeHint(request?: Request) {
	const cookieString = getCookieString(request)
	return colorSchemeHint.transform(
		getCookieValue(cookieString, colorSchemeHint.name),
	)
}

/**
 * @param request {Request} - optional request object (only used on server)
 * @returns the clock offset value in minutes
 */
export function getClockOffsetHint(request?: Request) {
	const cookieString = getCookieString(request)
	return clockOffsetHint.transform(
		getCookieValue(cookieString, clockOffsetHint.name),
	)
}

/**
 * @returns inline script element that checks for client hints and sets cookies
 * if they are not set then reloads the page if any cookie was set to an
 * inaccurate value.
 */
export function ClientHintCheck() {
	return (
		<script
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
		const name = JSON.stringify(hint.name)
		return `{ name: ${name}, actual: String(${hint.getValueCode}), cookie: cookies[${name}] }`
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
