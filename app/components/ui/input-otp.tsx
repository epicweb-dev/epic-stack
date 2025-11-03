import { OTPInput, OTPInputContext } from 'input-otp'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const InputOTP = ({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput>) => (
	<OTPInput
		inputMode="text"
		data-slot="input-otp"
		containerClassName={cn(
			'flex items-center gap-2 has-disabled:opacity-50',
			containerClassName,
		)}
		className={cn('disabled:cursor-not-allowed', className)}
		{...props}
	/>
)

const InputOTPGroup = ({
	className,
	...props
}: React.ComponentProps<'div'>) => (
	<div
		data-slot="input-otp-group"
		className={cn('flex items-center', className)}
		{...props}
	/>
)

const InputOTPSlot = ({
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
			data-slot="input-otp-slot"
			className={cn(
				'border-input relative flex size-10 items-center justify-center border-y border-r text-base transition-all first:rounded-l-md first:border-l last:rounded-r-md md:text-sm',
				isActive && 'ring-ring ring-offset-background z-10 ring-2',
				className,
			)}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
				</div>
			)}
		</div>
	)
}

const InputOTPSeparator = (props: React.ComponentProps<'div'>) => (
	<div data-slot="input-otp-separator" className="flex-1" {...props}></div>
)

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
