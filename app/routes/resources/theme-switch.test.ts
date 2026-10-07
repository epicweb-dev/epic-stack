import { type AppLoadContext } from 'react-router'
import { expect, test } from 'vitest'
import { BASE_URL } from '#tests/utils.ts'
import { type Route } from './+types/theme-switch.ts'
import { action } from './theme-switch.tsx'

const ROUTE_PATH = '/resources/theme-switch'

function submitTheme(redirectTo: string) {
	const request = new Request(new URL(ROUTE_PATH, BASE_URL), {
		method: 'POST',
		body: new URLSearchParams({ theme: 'dark', redirectTo }),
	})
	return action({
		request,
		params: {},
		context: {} as AppLoadContext,
		url: new URL(ROUTE_PATH, BASE_URL),
		pattern: ROUTE_PATH,
	} satisfies Route.ActionArgs)
}

test('redirects back to the given path', async () => {
	const response = await submitTheme('/users/kody?tab=notes')
	expect(response).toHaveRedirect('/users/kody?tab=notes')
})

test('does not redirect to other origins', async () => {
	expect(await submitTheme('https://attacker.example')).toHaveRedirect('/')
	expect(await submitTheme('//attacker.example')).toHaveRedirect('/')
})
