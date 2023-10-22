import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const listVariants = cva('', {
	variants: {
		variant: {
			default: '',
			sidebar: 'overflow-y-auto overflow-x-hidden pb-12',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface ListProps
	extends React.HTMLAttributes<HTMLUListElement>,
		VariantProps<typeof listVariants> {
	asChild?: boolean
}

const List = React.forwardRef<HTMLElement, ListProps>(
	({ className, variant, asChild = false, ...props }) => {
		const Comp = asChild ? Slot : 'ul'
		return (
			<Comp className={cn(listVariants({ variant, className }))} {...props} />
		)
	},
)
List.displayName = 'List'

export { List, listVariants }
