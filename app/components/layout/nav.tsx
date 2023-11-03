import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const navVariants = cva('nav', {
	variants: {
		variant: {
			default: 'flex items-center justify-between',
			marketing: '',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface NavProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof navVariants> {
	asChild?: boolean
}

const Nav = React.forwardRef<HTMLElement, NavProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'nav'
		return (
			<Comp
				className={cn(navVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Nav.displayName = 'Nav'

export { Nav, navVariants }
