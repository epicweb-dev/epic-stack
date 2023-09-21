import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { resolveConnectionData } from '#app/utils/connections.server.ts'
import {
	ProviderConnectionForm,
	ProviderNameSchema,
	providerNames,
} from '#app/utils/connections.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { createToastHeaders } from '#app/utils/toast.server.ts'

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
		const r = ProviderNameSchema.safeParse(connection.providerName)
		if (!r.success) continue
		const connectionData = await resolveConnectionData(
			r.data,
			connection.providerId,
		)
		if (connectionData) {
			connections.push({
				...connectionData,
				id: connection.id,
				createdAtFormatted: connection.createdAt.toLocaleString(),
			})
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
			<div className="mt-5 flex flex-col gap-5 border-b-2 border-t-2 border-border py-3">
				{providerNames.map(providerName => (
					<ProviderConnectionForm
						key={providerName}
						type="Login"
						providerName={providerName}
					/>
				))}
			</div>
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
