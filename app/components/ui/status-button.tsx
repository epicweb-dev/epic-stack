import * as React from 'react'
import { Button, type ButtonProps } from './button.tsx'
import { cn } from '~/utils/misc.ts'

export const StatusButton = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & { status: 'pending' | 'success' | 'error' | 'idle' }
>(({ status = 'idle', className, children, ...props }, ref) => {
	const companion = {
		pending: <span className="inline-block animate-spin">🌀</span>,
		success: <span>✅</span>,
		error: <span>❌</span>,
		idle: null,
	}[status]
	return (
		<Button
			ref={ref}
			className={cn('flex justify-center gap-4', className)}
			{...props}
		>
			<div>{children}</div>
			{companion}
		</Button>
	)
})
StatusButton.displayName = 'Button'
