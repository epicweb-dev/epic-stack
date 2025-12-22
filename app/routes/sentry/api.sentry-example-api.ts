import * as Sentry from '@sentry/react-router'
import { requireUserWithRole } from '../../utils/permissions.server.ts'
import { type Route } from './+types/api.sentry-example-api.ts'

class SentryExampleBackendError extends Error {
	constructor(message: string | undefined) {
		super(message)
		this.name = 'SentryExampleBackendError'
	}
}

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserWithRole(request, 'admin')

	await Sentry.startSpan(
		{
			name: 'Example Backend Span',
			op: 'test',
		},
		async () => {
			// Simulate some backend work
			await new Promise((resolve) => setTimeout(resolve, 100))
		},
	)

	throw new SentryExampleBackendError(
		'This error is raised on the backend API route.',
	)
}
