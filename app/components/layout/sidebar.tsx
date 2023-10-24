import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const sidebarVariants = cva('', {
	variants: {
		variant: {
			default: 'relative col-span-1',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface SidebarProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof sidebarVariants> {
	asChild?: boolean
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		if (ref && typeof ref !== 'function') {
			throw new Error('Ref must be a function')
		}
		const Comp = asChild ? Slot : 'aside'
		return (
			<Comp
				className={cn(sidebarVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Sidebar.displayName = 'Sidebar'

export { Sidebar, sidebarVariants }
