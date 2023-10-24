import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const mainContainerVariants = cva('main', {
	variants: {
		variant: {
			default:
				'grid w-full grid-cols-4 bg-muted pl-2 md:container md:mx-2 md:rounded-3xl md:pr-0',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface MainContainerProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof mainContainerVariants> {
	asChild?: boolean
}

const MainContainer = React.forwardRef<HTMLElement, MainContainerProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		if (ref && typeof ref !== 'function') {
			throw new Error('Ref must be a function')
		}
		const Comp = asChild ? Slot : 'div'
		return (
			<Comp
				className={cn(mainContainerVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
MainContainer.displayName = 'MainContainer'

export { MainContainer, mainContainerVariants }
