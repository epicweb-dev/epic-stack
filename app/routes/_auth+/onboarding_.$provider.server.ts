import { invariant } from '@epic-web/invariant'
import { redirect } from '@remix-run/node'


import { onboardingEmailSessionKey } from '#/app/routes/_auth+/onboarding.tsx'
import { type VerifyFunctionArgs } from '#/app/routes/_auth+/verify.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'

export async function handleVerification({ submission }: VerifyFunctionArgs) {
	invariant(
		submission.status === 'success',
		'Submission should be successful by now',
	)
	const verifySession = await verifySessionStorage.getSession()
	verifySession.set(onboardingEmailSessionKey, submission.value.target)
	return redirect('/onboarding', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	})
}
