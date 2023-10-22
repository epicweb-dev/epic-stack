import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const mainVariants = cva('main', {
	variants: {
		variant: {
			default: 'container flex h-full min-h-[400px] px-0 pb-12 md:px-8',
			landing:
				'relative min-h-screen sm:flex sm:items-center sm:justify-center',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface MainProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof mainVariants> {
	asChild?: boolean
}

const Main = React.forwardRef<HTMLElement, MainProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'main'
		return (
			<Comp
				className={cn(mainVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Main.displayName = 'Main'

export { Main, mainVariants }
