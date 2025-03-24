import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const Input = ({
	className,
	type,
	...props
}: React.ComponentProps<'input'>) => {
	return (
		<input
			data-slot="input"
			type={type}
			className={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring aria-[invalid]:border-input-invalid flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-base file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm md:file:text-sm',
				className,
			)}
			{...props}
		/>
	)
}

export { Input }
