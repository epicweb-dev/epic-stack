import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const footerVariants = cva('footer', {
	variants: {
		variant: {
			default: 'container flex justify-between pb-5',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface FooterProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof footerVariants> {
	asChild?: boolean
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'footer'
		return (
			<Comp
				className={cn(footerVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Footer.displayName = 'Footer'

export { Footer, footerVariants }
