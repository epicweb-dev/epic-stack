import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const listItemVariants = cva('', {
	variants: {
		variant: {
			default: '',
			sidebar: 'p-1 pr-0',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface ListItemProps
	extends React.HTMLAttributes<HTMLLIElement>,
		VariantProps<typeof listItemVariants> {
	asChild?: boolean
}

const ListItem = React.forwardRef<HTMLElement, ListItemProps>(
	({ className, variant, asChild = false, ...props }) => {
		const Comp = asChild ? Slot : 'li'
		return (
			<Comp
				className={cn(listItemVariants({ variant, className }))}
				{...props}
			/>
		)
	},
)
ListItem.displayName = 'ListItem'

export { ListItem, listItemVariants }
