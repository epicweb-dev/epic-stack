import { Slot } from '@radix-ui/react-slot'
import { useMatches } from '@remix-run/react'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'
import { SearchBar } from '../search-bar.tsx'

const navSearchVariants = cva('nav', {
	variants: {
		variant: {
			// mobile first
			default: 'block w-full sm:hidden',
			mobile: 'block w-full sm:hidden',
			desktop: 'ml-auto hidden max-w-sm flex-1 sm:block xxx',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export interface NavSearchProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof navSearchVariants> {
	asChild?: boolean
}

const NavSearch = React.forwardRef<HTMLElement, NavSearchProps>(
	({ className, variant, asChild = false, ...props }) => {
		const matches = useMatches()
		const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
		const searchBar = isOnSearchPage ? null : <SearchBar status="idle" />

		const Comp = asChild ? Slot : 'div'
		// <div className="ml-auto hidden max-w-sm flex-1 sm:block">{searchBar}</div>

		return (
			<Comp
				className={cn(navSearchVariants({ variant, className }))}
				{...props}
			>
				{searchBar}
			</Comp>
		)
	},
)
NavSearch.displayName = 'NavSearch'

export { NavSearch, navSearchVariants }
