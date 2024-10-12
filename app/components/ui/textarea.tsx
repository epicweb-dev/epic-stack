import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	ref?: React.RefObject<HTMLTextAreaElement>
}

const Textarea = ({ ref, className, ...props }: TextareaProps) => {
	return (
		<textarea
			className={cn(
				'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid md:text-sm',
				className,
			)}
			ref={ref}
			{...props}
		/>
	)
}
Textarea.displayName = 'Textarea'

export { Textarea }
