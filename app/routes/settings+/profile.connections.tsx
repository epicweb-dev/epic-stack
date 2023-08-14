import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { GITHUB_PROVIDER_NAME } from '~/utils/github-auth.server.ts'
import { invariantResponse, useIsPending } from '~/utils/misc.tsx'
import { createToastHeaders } from '~/utils/toast.server.ts'

export const handle = {
	breadcrumb: <Icon name="link-2">Connections</Icon>,
}

async function userCanDeleteConnections(userId: string) {
	const user = await prisma.user.findUnique({
		select: {
			password: { select: { userId: true } },
			_count: { select: { connections: true } },
		},
		where: { id: userId },
	})
	// user can delete their connections if they have a password
	if (user?.password) return true
	// users have to have more than one remaining connection to delete one
	return Boolean(user?._count.connections && user?._count.connections > 1)
}

const GitHubUserSchema = z.object({ login: z.string() })

async function resolveGitHubConnectionData(connection: {
	id: string
	providerName: string
	providerId: string
	createdAt: Date
}) {
	const response = await fetch(
		`https://api.github.com/user/${connection.providerId}`,
		{ headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } },
	)
	const rawJson = await response.json()
	const result = GitHubUserSchema.safeParse(rawJson)
	return {
		id: connection.id,
		displayName: result.success ? result.data.login : 'Unknown',
		link: result.success ? `https://github.com/${result.data.login}` : null,
		createdAtFormatted: connection.createdAt.toLocaleString(),
	}
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const rawConnections = await prisma.connection.findMany({
		select: { id: true, providerName: true, providerId: true, createdAt: true },
		where: { userId },
	})
	const connections: Array<{
		id: string
		displayName: string
		link?: string | null
		createdAtFormatted: string
	}> = []
	for (const connection of rawConnections) {
		if (connection.providerName === GITHUB_PROVIDER_NAME) {
			connections.push(await resolveGitHubConnectionData(connection))
		} else {
			connections.push({
				id: connection.id,
				displayName: 'Unknown',
				createdAtFormatted: connection.createdAt.toLocaleString(),
			})
		}
	}

	return json({
		connections,
		canDeleteConnections: await userCanDeleteConnections(userId),
	})
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	invariantResponse(
		formData.get('intent') === 'delete-connection',
		'Invalid intent',
	)
	invariantResponse(
		await userCanDeleteConnections(userId),
		'You cannot delete your last connection unless you have a password.',
	)
	const connectionId = formData.get('connectionId')
	invariantResponse(typeof connectionId === 'string', 'Invalid connectionId')
	await prisma.connection.delete({
		where: {
			id: connectionId,
			userId: userId,
		},
	})
	const toastHeaders = await createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	return json({ status: 'success' } as const, { headers: toastHeaders })
}

export default function Connections() {
	const data = useLoaderData<typeof loader>()
	const isGitHubSubmitting = useIsPending({ formAction: '/auth/github' })

	return (
		<div className="mx-auto max-w-md">
			{data.connections.length ? (
				<div className="flex flex-col gap-2">
					<p>Here are your current connections:</p>
					<ul className="flex flex-col gap-4">
						{data.connections.map(c => (
							<li key={c.id}>
								<Connection
									connection={c}
									canDelete={data.canDeleteConnections}
								/>
							</li>
						))}
					</ul>
				</div>
			) : (
				<p>You don't have any connections yet.</p>
			)}
			<Form
				className="mt-5 flex items-center justify-center gap-2 border-t-2 border-border pt-3"
				action="/auth/github"
				method="POST"
			>
				<StatusButton
					type="submit"
					className="w-full"
					status={isGitHubSubmitting ? 'pending' : 'idle'}
				>
					<Icon name="github-logo">Connect with GitHub</Icon>
				</StatusButton>
			</Form>
		</div>
	)
}

function Connection({
	connection,
	canDelete,
}: {
	connection: SerializeFrom<typeof loader>['connections'][number]
	canDelete: boolean
}) {
	const deleteFetcher = useFetcher<typeof action>()
	const [infoOpen, setInfoOpen] = useState(false)
	return (
		<div className="flex justify-between gap-2">
			<Icon name="github-logo">
				{connection.link ? (
					<a href={connection.link} className="underline">
						{connection.displayName}
					</a>
				) : (
					connection.displayName
				)}{' '}
				({connection.createdAtFormatted})
			</Icon>
			{canDelete ? (
				<deleteFetcher.Form method="POST">
					<input name="connectionId" value={connection.id} type="hidden" />
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<StatusButton
									name="intent"
									value="delete-connection"
									variant="destructive"
									size="sm"
									status={
										deleteFetcher.state !== 'idle'
											? 'pending'
											: deleteFetcher.data?.status ?? 'idle'
									}
								>
									<Icon name="cross-1" />
								</StatusButton>
							</TooltipTrigger>
							<TooltipContent>Disconnect this account</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</deleteFetcher.Form>
			) : (
				<TooltipProvider>
					<Tooltip open={infoOpen} onOpenChange={setInfoOpen}>
						<TooltipTrigger onClick={() => setInfoOpen(true)}>
							<Icon name="question-mark-circled"></Icon>
						</TooltipTrigger>
						<TooltipContent>
							You cannot delete your last connection unless you have a password.
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	)
}
