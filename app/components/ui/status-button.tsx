import * as React from 'react'
import { Button, type ButtonProps } from './button.tsx'
import { cn } from '~/utils/misc.ts'
import { useSpinDelay } from 'spin-delay'

export const StatusButton = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & { status: 'pending' | 'success' | 'error' | 'idle' } & {
		spinDelay?: Parameters<typeof useSpinDelay>[1]
	}
>(({ status = 'idle', className, children, spinDelay, ...props }, ref) => {
	const pending = useSpinDelay(status === 'pending', {
		delay: 300,
		minDuration: 200,
		...spinDelay,
	})
	const companion = {
		pending: pending ? (
			<span className="inline-block animate-spin">🌀</span>
		) : null,
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
