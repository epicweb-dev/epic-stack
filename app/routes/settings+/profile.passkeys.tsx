import { startRegistration } from '@simplewebauthn/browser'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { Form, useRevalidator } from 'react-router'
import { z } from 'zod'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/profile.passkeys.ts'

export const handle = {
	breadcrumb: <Icon name="passkey">Passkeys</Icon>,
}

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const passkeys = await prisma.passkey.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			deviceType: true,
			createdAt: true,
		},
	})
	return { passkeys }
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete') {
		const passkeyId = formData.get('passkeyId')
		if (typeof passkeyId !== 'string') {
			return Response.json(
				{ status: 'error', error: 'Invalid passkey ID' },
				{ status: 400 },
			)
		}

		await prisma.passkey.delete({
			where: {
				id: passkeyId,
				userId, // Ensure the passkey belongs to the user
			},
		})
		return Response.json({ status: 'success' })
	}

	return Response.json(
		{ status: 'error', error: 'Invalid intent' },
		{ status: 400 },
	)
}

const RegistrationResultSchema = z.object({
	options: z.object({
		rp: z.object({
			id: z.string(),
			name: z.string(),
		}),
		user: z.object({
			id: z.string(),
			name: z.string(),
			displayName: z.string(),
		}),
		challenge: z.string(),
		pubKeyCredParams: z.array(
			z.object({
				type: z.literal('public-key'),
				alg: z.number(),
			}),
		),
	}),
}) satisfies z.ZodType<{ options: PublicKeyCredentialCreationOptionsJSON }>

export default function Passkeys({ loaderData }: Route.ComponentProps) {
	const revalidator = useRevalidator()
	const [error, setError] = useState<string | null>(null)

	async function handlePasskeyRegistration() {
		try {
			setError(null)
			const resp = await fetch('/webauthn/registration')
			const jsonResult = await resp.json()
			const parsedResult = RegistrationResultSchema.parse(jsonResult)

			const regResult = await startRegistration({
				optionsJSON: parsedResult.options,
			})

			const verificationResp = await fetch('/webauthn/registration', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(regResult),
			})

			if (!verificationResp.ok) {
				throw new Error('Failed to verify registration')
			}

			void revalidator.revalidate()
		} catch (err) {
			console.error('Failed to create passkey:', err)
			setError('Failed to create passkey. Please try again.')
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex justify-between gap-4">
				<h1 className="text-h1">Passkeys</h1>
				<form action={handlePasskeyRegistration}>
					<Button
						type="submit"
						variant="secondary"
						className="flex items-center gap-2"
					>
						<Icon name="plus">Register new passkey</Icon>
					</Button>
				</form>
			</div>

			{error ? (
				<div className="rounded-lg bg-destructive/15 p-4 text-destructive">
					{error}
				</div>
			) : null}

			{loaderData.passkeys.length ? (
				<ul className="flex flex-col gap-4" title="passkeys">
					{loaderData.passkeys.map((passkey) => (
						<li
							key={passkey.id}
							className="flex items-center justify-between gap-4 rounded-lg border border-muted-foreground p-4"
						>
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<Icon name="lock-closed" />
									<span className="font-semibold">
										{passkey.deviceType === 'platform'
											? 'Device'
											: 'Security Key'}
									</span>
								</div>
								<div className="text-sm text-muted-foreground">
									Registered {formatDistanceToNow(new Date(passkey.createdAt))}{' '}
									ago
								</div>
							</div>
							<Form method="POST">
								<input type="hidden" name="passkeyId" value={passkey.id} />
								<Button
									type="submit"
									name="intent"
									value="delete"
									variant="destructive"
									size="sm"
									className="flex items-center gap-2"
								>
									<Icon name="trash">Delete</Icon>
								</Button>
							</Form>
						</li>
					))}
				</ul>
			) : (
				<div className="text-center text-muted-foreground">
					No passkeys registered yet
				</div>
			)}
		</div>
	)
}
