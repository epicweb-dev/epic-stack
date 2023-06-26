import * as Dialog from '@radix-ui/react-dialog'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useNavigate } from '@remix-run/react'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'

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

	const dismissModal = () => navigate('..', { preventScrollReset: true })
	return (
		<Dialog.Root open={true}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 backdrop-blur-[2px]" />
				<Dialog.Content
					onEscapeKeyDown={dismissModal}
					onPointerDownOutside={dismissModal}
					className="fixed left-1/2 top-1/2 max-h-full w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform overflow-y-scroll rounded-lg bg-night-500 p-12 shadow-lg"
				>
					<Dialog.Title asChild className="text-center">
						<h2 className="text-h2">Two-Factor Authentication</h2>
					</Dialog.Title>
					<div className="mt-6">
						<Outlet />
					</div>
					<Dialog.Close asChild>
						<Link
							preventScrollReset
							to=".."
							aria-label="Close"
							className="absolute right-10 top-10"
						>
							❌
						</Link>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
