import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useSearchParams } from '@remix-run/react'
import { Spacer } from '~/components/spacer.tsx'
import {
	Verify,
	codeQueryParam,
	validateRequest,
} from '../resources+/verify.tsx'

export async function loader({ request }: DataFunctionArgs) {
	const params = new URL(request.url).searchParams
	if (!params.has(codeQueryParam)) {
		// we don't want to show an error message on page load if the otp hasn't be
		// prefilled in yet, so we'll send a response with an empty submission.
		return json({
			status: 'idle',
			submission: {
				intent: '',
				payload: Object.fromEntries(params),
				error: {},
			},
		} as const)
	}
	return validateRequest(request, params)
}

export default function VerifyRoute() {
	const data = useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()

	return (
		<div className="container flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Check your email</h1>
				<p className="mt-3 text-body-md text-muted-foreground">
					We've sent you a code to verify your email address.
				</p>
			</div>

			<Spacer size="xs" />

			<Verify
				code={searchParams.get('code') ?? ''}
				type={searchParams.get('type') ?? ('' as any)}
				target={searchParams.get('target') ?? ''}
				redirectTo={searchParams.get('redirectTo') ?? ''}
				initialSubmission={data.submission}
				submitChildren="Submit"
			/>
		</div>
	)
}
