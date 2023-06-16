import { json, type DataFunctionArgs } from '@remix-run/node'
import { Outlet, useNavigate } from '@remix-run/react'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/index.tsx'

export const twoFAVerificationType = '2fa'

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: userId },
		select: { id: true },
	})
	return json({ is2FAEnabled: Boolean(verification) })
}

export default function TwoFactorRoute() {
	const navigate = useNavigate()

	const dismissModal = () =>
		navigate('/settings/profile', { preventScrollReset: true })
	return (
		<Dialog open={true} onOpenChange={open => !open && dismissModal()}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
				className="fixed left-1/2 top-1/2 max-h-full w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform overflow-y-scroll rounded-lg bg-night-500 p-12 shadow-lg"
			>
				<DialogHeader>
					<DialogTitle>Two-Factor Authentication</DialogTitle>
				</DialogHeader>
				<Outlet />
			</DialogContent>
		</Dialog>
	)
}
