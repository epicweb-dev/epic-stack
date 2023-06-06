import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import * as React from 'react'
import { z } from 'zod'
import { useHints } from '~/utils/client-hints.tsx'
import { ErrorList } from '~/utils/forms.tsx'
import { safeRedirect } from '~/utils/misc.ts'
import { useRequestInfo } from '~/utils/request-info.ts'
import {
	commitSession,
	deleteTheme,
	getSession,
	setTheme,
} from '~/utils/session.server.ts'

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
		id: 'onboarding',
		lastSubmission: fetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ThemeFormSchema })
		},
	})

	const mode = userPreference ?? 'system'
	const nextMode =
		mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
	const modeLabel = {
		light: (
			<>
				🔆 <span className="sr-only">Light</span>
			</>
		),
		dark: (
			<>
				🌕 <span className="sr-only">Dark</span>
			</>
		),
		system: (
			<>
				💻 <span className="sr-only">System</span>
			</>
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
	return requestInfo.session.theme ?? hints.theme
}
