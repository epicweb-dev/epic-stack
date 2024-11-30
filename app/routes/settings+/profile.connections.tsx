import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
	type SerializeFrom,
	type HeadersFunction,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { count, or, eq, gt, isNotNull, and } from 'drizzle-orm'
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
	type ProviderName,
	ProviderNameSchema,
	providerIcons,
	providerNames,
} from '#app/utils/connections.tsx'
import { drizzle } from '#app/utils/db.server.ts'
import { makeTimings } from '#app/utils/timing.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { User, Password, Connection } from '#drizzle/schema.ts'
import { type BreadcrumbHandle } from './profile.tsx'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="link-2">Connections</Icon>,
	getSitemapEntries: () => null,
}

async function userCanDeleteConnections(userId: string) {
	const user = await drizzle
		.select({ countConnections: count(Connection.id) })
		.from(User)
		.leftJoin(Password, eq(User.id, Password.userId))
		.leftJoin(Connection, eq(User.id, Connection.userId))
		.groupBy(User.id)
		.where(eq(User.id, userId))
		// user can delete all their connections if they have a password
		// otherwise, they must keep at least one connection
		.having(({ countConnections }) =>
			or(gt(countConnections, 1), isNotNull(Password.userId)),
		)
	return Boolean(user)
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const timings = makeTimings('profile connections loader')
	const rawConnections = await drizzle.query.Connection.findMany({
		columns: {
			id: true,
			providerName: true,
			providerId: true,
			createdAt: true,
		},
		where: eq(Connection.userId, userId),
	})
	const connections: Array<{
		providerName: ProviderName
		id: string
		displayName: string
		link?: string | null
		createdAtFormatted: string
	}> = []
	for (const connection of rawConnections) {
		const r = ProviderNameSchema.safeParse(connection.providerName)
		if (!r.success) continue
		const providerName = r.data
		const connectionData = await resolveConnectionData(
			providerName,
			connection.providerId,
			{ timings },
		)
		connections.push({
			...connectionData,
			providerName,
			id: connection.id,
			createdAtFormatted: connection.createdAt.toLocaleString(),
		})
	}

	return json(
		{
			connections,
			canDeleteConnections: await userCanDeleteConnections(userId),
		},
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

export async function action({ request }: ActionFunctionArgs) {
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
	await drizzle
		.delete(Connection)
		.where(and(eq(Connection.id, connectionId), eq(Connection.userId, userId)))
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
						{data.connections.map((c) => (
							<li key={c.id}>
								<ConnectionComponent
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
				{providerNames.map((providerName) => (
					<ProviderConnectionForm
						key={providerName}
						type="Connect"
						providerName={providerName}
					/>
				))}
			</div>
		</div>
	)
}

function ConnectionComponent({
	connection,
	canDelete,
}: {
	connection: SerializeFrom<typeof loader>['connections'][number]
	canDelete: boolean
}) {
	const deleteFetcher = useFetcher<typeof action>()
	const [infoOpen, setInfoOpen] = useState(false)
	const icon = providerIcons[connection.providerName]
	return (
		<div className="flex justify-between gap-2">
			<span className={`inline-flex items-center gap-1.5`}>
				{icon}
				<span>
					{connection.link ? (
						<a href={connection.link} className="underline">
							{connection.displayName}
						</a>
					) : (
						connection.displayName
					)}{' '}
					({connection.createdAtFormatted})
				</span>
			</span>
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
											: (deleteFetcher.data?.status ?? 'idle')
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
