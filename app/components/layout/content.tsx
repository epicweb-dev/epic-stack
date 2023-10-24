import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const contentVariants = cva('', {
	variants: {
		variant: {
			default: '',
			index: 'container pt-12',
			show: 'absolute inset-0 flex flex-col px-10',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface ContentProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof contentVariants> {
	asChild?: boolean
}

const Content = React.forwardRef<HTMLElement, ContentProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		if (ref && typeof ref !== 'function') {
			throw new Error('Ref must be a function')
		}
		const Comp = asChild ? Slot : 'div'
		return (
			<Comp
				className={cn(contentVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Content.displayName = 'Content'

export { Content, contentVariants }
