import {
	json,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Spacer } from '~/components/spacer.tsx'
import { requireAnonymous } from '~/utils/auth.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { InlineLogin, getLoginLoaderData } from '../resources+/login.tsx'

export async function loader(args: DataFunctionArgs) {
	const { request } = args
	await requireAnonymous(request)
	const session = await getSession(request.headers.get('cookie'))

	return json(
		{ loginLoaderData: await getLoginLoaderData(args) },
		{ headers: { 'Set-Cookie': await commitSession(session) } },
	)
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Login to Epic Notes' }]
}

export default function LoginPage() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-md">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome back!</h1>
					<p className="text-body-md text-muted-foreground">
						Please enter your details.
					</p>
				</div>
				<Spacer size="xs" />
				<InlineLogin {...data.loginLoaderData} />
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
