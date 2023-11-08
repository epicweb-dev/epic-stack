import { type MetaFunction } from '@remix-run/react'
import { PageContentIndex } from '#app/components/index.ts'

export default function AdminIndexRoute() {
	return <PageContentIndex message="Hello admin" />
}

export const meta: MetaFunction = () => {
	return [
		{ title: `Admin | Epic Notes` },
		{
			name: 'description',
			content: `Admin page for Epic Notes`,
		},
	]
}
