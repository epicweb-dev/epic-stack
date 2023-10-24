import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const headerVariants = cva('header', {
	variants: {
		variant: {
			default: 'container py-6',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface HeaderProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof headerVariants> {
	asChild?: boolean
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'header'
		return (
			<Comp
				className={cn(headerVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Header.displayName = 'Header'

export { Header, headerVariants }
