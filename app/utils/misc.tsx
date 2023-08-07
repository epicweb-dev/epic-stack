import { redirect } from '@remix-run/node'
import { useFormAction, useNavigation } from '@remix-run/react'
import { clsx, type ClassValue } from 'clsx'
import { parseAcceptLanguage } from 'intl-parse-accept-language'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ServerOnly, safeRedirect } from 'remix-utils'
import { useSpinDelay } from 'spin-delay'
import { twMerge } from 'tailwind-merge'
import { getHints } from './client-hints.tsx'

export function getUserImgSrc(imageId?: string | null) {
	return imageId ? `/resources/file/${imageId}` : `/img/user.png`
}

export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getDomainUrl(request: Request) {
	const host =
		request.headers.get('X-Forwarded-Host') ?? request.headers.get('host')
	if (!host) {
		throw new Error('Could not determine domain URL.')
	}
	const protocol = host.includes('localhost') ? 'http' : 'https'
	return `${protocol}://${host}`
}

export function getReferrerRoute(request: Request) {
	// spelling errors and whatever makes this annoyingly inconsistent
	// in my own testing, `referer` returned the right value, but 🤷‍♂️
	const referrer =
		request.headers.get('referer') ??
		request.headers.get('referrer') ??
		request.referrer
	const domain = getDomainUrl(request)
	if (referrer?.startsWith(domain)) {
		return referrer.slice(domain.length)
	} else {
		return '/'
	}
}

/**
 * If the noJs boolean is true, this throws a redirect to the referrer route
 * with the given responseInit options. This should be used in combination with
 * the EnsurePE component in your form.
 *
 * NOTE: This is only necessary when your form is posting to a different action
 * from the current route. If your form is posting to the current route, things
 * will work whether you redirect or return json from your action.
 */
export async function ensurePE(
	data: FormData | URLSearchParams,
	request: Request,
	responseInit?:
		| ResponseInit
		| (() => ResponseInit)
		| (() => Promise<ResponseInit>),
) {
	if (data.get('no-js') === 'true') {
		throw redirect(
			safeRedirect(getReferrerRoute(request)),
			await (typeof responseInit === 'function'
				? responseInit()
				: responseInit),
		)
	}
}

/**
 * Renders a hidden input with the name "no-js" and value "true". It is removed
 * when JavaScript hydrates. This is so we can detect if the user has javascript
 * loaded or not. It should be used in combination with the ensurePE utility
 * in your action function.
 *
 * NOTE: This is only necessary when your form is posting to a different action
 * from the current route. If your form is posting to the current route, things
 * will work whether you redirect or return json from your action.
 */
export function EnsurePE() {
	return (
		<ServerOnly>
			{() => <input type="hidden" name="no-js" value="true" />}
		</ServerOnly>
	)
}

/**
 * Merge multiple headers objects into one (uses set so headers are overridden)
 */
export function mergeHeaders(...headers: Array<ResponseInit['headers']>) {
	const merged = new Headers()
	for (const header of headers) {
		for (const [key, value] of new Headers(header).entries()) {
			merged.set(key, value)
		}
	}
	return merged
}

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(...headers: Array<ResponseInit['headers']>) {
	const combined = new Headers()
	for (const header of headers) {
		for (const [key, value] of new Headers(header).entries()) {
			combined.append(key, value)
		}
	}
	return combined
}

/**
 * Provide a condition and if that condition is falsey, this throws an error
 * with the given message.
 *
 * inspired by invariant from 'tiny-invariant' except will still include the
 * message in production.
 *
 * @example
 * invariant(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw (or a callback to generate the message)
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Error} if condition is falsey
 */
export function invariant(
	condition: any,
	message: string | (() => string),
): asserts condition {
	if (!condition) {
		throw new Error(typeof message === 'function' ? message() : message)
	}
}

/**
 * Provide a condition and if that condition is falsey, this throws a 400
 * Response with the given message.
 *
 * inspired by invariant from 'tiny-invariant'
 *
 * @example
 * invariantResponse(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw (or a callback to generate the message)
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Response} if condition is falsey
 */
export function invariantResponse(
	condition: any,
	message: string | (() => string),
	responseInit?: ResponseInit,
): asserts condition {
	if (!condition) {
		throw new Response(typeof message === 'function' ? message() : message, {
			status: 400,
			...responseInit,
		})
	}
}

/**
 * Uses the request's accept-language header to determine the user's preferred
 * locale and the client hint cookies for the user's timeZone returns a
 * DateTimeFormat object for that locale and timezone.
 *
 * All options can be overridden by passing in an options object. By default,
 * the options are all "numeric" and the timeZone.
 */
export function getDateTimeFormat(
	request: Request,
	options?: Intl.DateTimeFormatOptions,
) {
	const locales = parseAcceptLanguage(request.headers.get('accept-language'), {
		validate: Intl.DateTimeFormat.supportedLocalesOf,
	})
	const locale = locales[0] ?? 'en-US'

	// change your default options here
	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	}
	options = {
		...defaultOptions,
		...options,
		timeZone: options?.timeZone ?? getHints(request).timeZone,
	}
	return new Intl.DateTimeFormat(locale, options)
}

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 *
 * If GET, then this uses navigation.state === 'loading' instead of submitting.
 *
 * NOTE: the default formAction will include query params, but the
 * navigation.formAction will not, so don't use the default formAction if you
 * want to know if a form is submitting without specific query params.
 */
export function useIsSubmitting({
	formAction,
	formMethod = 'POST',
}: {
	formAction?: string
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
} = {}) {
	const contextualFormAction = useFormAction()
	const navigation = useNavigation()
	return (
		navigation.state === (formMethod === 'GET' ? 'loading' : 'submitting') &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod
	)
}

/**
 * This combines useSpinDelay (from https://npm.im/spin-delay) and useIsSubmitting
 * from our own utilities to give you a nice way to show a loading spinner for
 * a minimum amount of time, even if the request finishes right after the delay.
 *
 * This avoids a flash of loading state regardless of how fast or slow the
 * request is.
 */
export function useDelayedIsSubmitting({
	formAction,
	formMethod,
	delay = 400,
	minDuration = 300,
}: Parameters<typeof useIsSubmitting>[0] &
	Parameters<typeof useSpinDelay>[1] = {}) {
	const isSubmitting = useIsSubmitting({ formAction, formMethod })
	const delayedIsSubmitting = useSpinDelay(isSubmitting, {
		delay,
		minDuration,
	})
	return delayedIsSubmitting
}

function callAll<Args extends Array<unknown>>(
	...fns: Array<((...args: Args) => unknown) | undefined>
) {
	return (...args: Args) => fns.forEach(fn => fn?.(...args))
}

/**
 * Use this hook with a button and it will make it so the first click sets a
 * `doubleCheck` state to true, and the second click will actually trigger the
 * `onClick` handler. This allows you to have a button that can be like a
 * "are you sure?" experience for the user before doing destructive operations.
 */
export function useDoubleCheck() {
	const [doubleCheck, setDoubleCheck] = useState(false)

	function getButtonProps(
		props?: React.ButtonHTMLAttributes<HTMLButtonElement>,
	) {
		const onBlur: React.ButtonHTMLAttributes<HTMLButtonElement>['onBlur'] =
			() => setDoubleCheck(false)

		const onClick: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'] =
			doubleCheck
				? undefined
				: e => {
						e.preventDefault()
						setDoubleCheck(true)
				  }

		return {
			...props,
			onBlur: callAll(onBlur, props?.onBlur),
			onClick: callAll(onClick, props?.onClick),
		}
	}

	return { doubleCheck, getButtonProps }
}

/**
 * Simple debounce implementation
 */
function debounce<Callback extends (...args: Parameters<Callback>) => void>(
	fn: Callback,
	delay: number,
) {
	let timer: ReturnType<typeof setTimeout> | null = null
	return (...args: Parameters<Callback>) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn(...args)
		}, delay)
	}
}

/**
 * Debounce a callback function
 */
export function useDebounce<
	Callback extends (...args: Parameters<Callback>) => ReturnType<Callback>,
>(callback: Callback, delay: number) {
	const callbackRef = useRef(callback)
	useEffect(() => {
		callbackRef.current = callback
	})
	return useMemo(
		() =>
			debounce(
				(...args: Parameters<Callback>) => callbackRef.current(...args),
				delay,
			),
		[delay],
	)
}
