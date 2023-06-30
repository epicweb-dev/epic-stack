import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useNavigate } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from '~/components/ui/dialog.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { useState } from 'react'

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
	const [open, setOpen] = useState(true)

	const dismissModal = () => {
		setOpen(false)
		navigate('..', { preventScrollReset: true })
	}
	return (
		<Dialog open={open}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
			>
				<DialogTitle asChild className="text-center">
					<h2 className="text-h2">Two-Factor Authentication</h2>
				</DialogTitle>
				<div className="mt-6">
					<Outlet />
				</div>
				<DialogClose asChild>
					<Link
						preventScrollReset
						to=".."
						aria-label="Close"
						className="absolute right-10 top-10"
					>
						<Icon name="cross-1" />
					</Link>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}
