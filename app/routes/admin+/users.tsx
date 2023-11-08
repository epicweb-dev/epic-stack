import { type DataFunctionArgs, json } from '@remix-run/node'
import { type MetaFunction } from '@remix-run/react'
import { PageContentIndex } from '#app/components/index.ts'
import { requireAdminUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	await requireAdminUserId(request)
	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			username: true,
			roles: true,
		},
	})
	return json({ users })
}

export default function AdminUsersRoute() {
	return <PageContentIndex message="Admin Users" />
}

export const meta: MetaFunction = () => {
	return [
		{ title: `Admin | Users` },
		{
			name: 'description',
			content: `Admin page for users for Epic Notes`,
		},
	]
}
