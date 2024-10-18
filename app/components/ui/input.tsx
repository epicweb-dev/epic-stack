import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	ref?: React.RefObject<HTMLInputElement>
}

const Input = ({ ref, className, type, ...props }: InputProps) => {
	return (
		<input
			type={type}
			className={cn(
				'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid md:text-sm md:file:text-sm',
				className,
			)}
			ref={ref}
			{...props}
		/>
	)
}
Input.displayName = 'Input'

export { Input }
