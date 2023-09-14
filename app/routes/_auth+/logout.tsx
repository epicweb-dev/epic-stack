import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { logout } from '#app/utils/auth.server.ts'

export async function loader() {
	return redirect('/')
}

export async function action({ request }: DataFunctionArgs) {
	return logout({ request })
}
