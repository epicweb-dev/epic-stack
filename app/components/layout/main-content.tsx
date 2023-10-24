import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const mainContentVariants = cva('main', {
	variants: {
		variant: {
			default: 'relative col-span-3 bg-accent md:rounded-r-3xl',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface MainContentProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof mainContentVariants> {
	asChild?: boolean
}

const MainContent = React.forwardRef<HTMLElement, MainContentProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		if (ref && typeof ref !== 'function') {
			throw new Error('Ref must be a function')
		}
		const Comp = asChild ? Slot : 'div'
		return (
			<Comp
				className={cn(mainContentVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
MainContent.displayName = 'MainContent'

export { MainContent, mainContentVariants }
