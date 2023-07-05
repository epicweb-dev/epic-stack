import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useFetchers } from '@remix-run/react'
import * as React from 'react'
import { safeRedirect } from 'remix-utils'
import { z } from 'zod'
import { useHints } from '~/utils/client-hints.tsx'
import { ErrorList } from '~/components/forms.tsx'
import { useRequestInfo } from '~/utils/request-info.ts'
import {
	commitSession,
	deleteTheme,
	getSession,
	setTheme,
} from './theme-session.server.ts'
import { Icon } from '~/components/ui/icon.tsx'

const ROUTE_PATH = '/resources/theme'

const ThemeFormSchema = z.object({
	redirectTo: z.string().optional(),
	theme: z.enum(['system', 'light', 'dark']),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: ThemeFormSchema,
		acceptMultipleErrors: () => true,
	})
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	const session = await getSession(request.headers.get('cookie'))
	const { redirectTo, theme } = submission.value
	if (theme === 'system') {
		deleteTheme(session)
	} else {
		setTheme(session, theme)
	}

	const responseInit = {
		headers: { 'Set-Cookie': await commitSession(session) },
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
	userPreference: 'light' | 'dark' | null
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

	const { submittedTheme } = useOptimisticTheme()
	const mode = submittedTheme ?? userPreference ?? 'system'
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
	const requestInfo = useRequestInfo()
	const { optimisticTheme, hints } = useOptimisticTheme()
	return optimisticTheme ?? requestInfo.session.theme ?? hints.theme
}

export function useOptimisticTheme() {
	const hints = useHints()
	const fetchers = useFetchers()

	const themeFetcher = fetchers.find(f => f.formAction?.startsWith(ROUTE_PATH))

	let submittedTheme
	let optimisticTheme

	if (themeFetcher && themeFetcher.formData) {
		const submission = parse(themeFetcher.formData, {
			schema: ThemeFormSchema,
		})
		submittedTheme = submission.value?.theme
		optimisticTheme = submittedTheme === 'system' ? hints.theme : submittedTheme
	}

	return { optimisticTheme, submittedTheme, hints }
}
