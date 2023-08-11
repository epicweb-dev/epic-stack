import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useFetchers } from '@remix-run/react'
import * as React from 'react'
import { safeRedirect } from 'remix-utils'
import { z } from 'zod'
import { ErrorList } from '~/components/forms.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { useHints } from '~/utils/client-hints.tsx'
import { useRequestInfo } from '~/utils/request-info.ts'
import { setTheme } from './theme.server.ts'

const ROUTE_PATH = '/resources/theme'

const ThemeFormSchema = z.object({
	redirectTo: z.string().optional(),
	theme: z.enum(['system', 'light', 'dark']),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: ThemeFormSchema,
	})
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	const { redirectTo, theme } = submission.value

	const responseInit = {
		headers: { 'Set-Cookie': setTheme(theme === 'system' ? undefined : theme) },
	}
	if (redirectTo) {
		return redirect(safeRedirect(redirectTo), responseInit)
	} else {
		return json({ success: true }, responseInit)
	}
}

export function ThemeSwitch({
	userPreference,
}: {
	userPreference?: 'light' | 'dark'
}) {
	const requestInfo = useRequestInfo()
	const fetcher = useFetcher()
	const [isHydrated, setIsHydrated] = React.useState(false)

	React.useEffect(() => {
		setIsHydrated(true)
	}, [])

	const [form] = useForm({
		id: 'theme-switch',
		lastSubmission: fetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ThemeFormSchema })
		},
	})

	const optimisticMode = useOptimisticThemeMode()
	const mode = optimisticMode ?? userPreference ?? 'system'
	const nextMode =
		mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
	const modeLabel = {
		light: (
			<Icon name="sun">
				<span className="sr-only">Light</span>
			</Icon>
		),
		dark: (
			<Icon name="moon">
				<span className="sr-only">Dark</span>
			</Icon>
		),
		system: (
			<Icon name="laptop">
				<span className="sr-only">System</span>
			</Icon>
		),
	}

	return (
		<fetcher.Form method="POST" action={ROUTE_PATH} {...form.props}>
			<div className="flex gap-2">
				{/*
					this is for progressive enhancement so we redirect them to the page
					they are on if the JavaScript hasn't had a chance to hydrate yet.
				*/}
				{isHydrated ? null : (
					<input type="hidden" name="redirectTo" value={requestInfo.path} />
				)}
				<input type="hidden" name="theme" value={nextMode} />
				<button className="flex h-8 w-8 cursor-pointer items-center justify-center">
					{modeLabel[mode]}
				</button>
			</div>
			<ErrorList errors={form.errors} id={form.errorId} />
		</fetcher.Form>
	)
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
	const hints = useHints()
	const requestInfo = useRequestInfo()
	const optimisticMode = useOptimisticThemeMode()
	if (optimisticMode) {
		return optimisticMode === 'system' ? hints.theme : optimisticMode
	}
	return requestInfo.userPrefs.theme ?? hints.theme
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
	const fetchers = useFetchers()

	const themeFetcher = fetchers.find(f => f.formAction?.startsWith(ROUTE_PATH))

	if (themeFetcher && themeFetcher.formData) {
		const submission = parse(themeFetcher.formData, {
			schema: ThemeFormSchema,
		})
		return submission.value?.theme
	}
}
