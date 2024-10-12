import { OTPInput, OTPInputContext } from 'input-otp'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const InputOTP = ({
	ref,
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput>) => (
	<OTPInput
		ref={ref}
		containerClassName={cn(
			'flex items-center gap-2 has-[:disabled]:opacity-50',
			containerClassName,
		)}
		className={cn('disabled:cursor-not-allowed', className)}
		{...props}
	/>
)
InputOTP.displayName = 'InputOTP'

const InputOTPGroup = ({
	ref,
	className,
	...props
}: React.ComponentProps<'div'>) => (
	<div ref={ref} className={cn('flex items-center', className)} {...props} />
)
InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = ({
	ref,
	index,
	className,
	...props
}: React.ComponentProps<'div'> & {
	index: number
}) => {
	const inputOTPContext = React.useContext(OTPInputContext)
	const slot = inputOTPContext.slots[index]
	if (!slot) throw new Error('Invalid slot index')
	const { char, hasFakeCaret, isActive } = slot

	return (
		<div
			ref={ref}
			className={cn(
				'relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-base transition-all first:rounded-l-md first:border-l last:rounded-r-md md:text-sm',
				isActive && 'z-10 ring-2 ring-ring ring-offset-background',
				className,
			)}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
				</div>
			)}
		</div>
	)
}
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = ({ ref, ...props }: React.ComponentProps<'div'>) => (
	<div ref={ref} role="separator" {...props}>
		-
	</div>
)
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
