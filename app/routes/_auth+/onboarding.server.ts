import { invariant } from '@epic-web/invariant'
import { redirect } from 'react-router'
import { requireAnonymousMiddleware } from '#app/middleware.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'
import { onboardingEmailSessionKey } from './onboarding.tsx'
import { type VerifyFunctionArgs } from './verify.server.ts'

export const middleware = [requireAnonymousMiddleware]

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
