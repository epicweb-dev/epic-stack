import * as LabelPrimitive from '@radix-ui/react-label'
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const labelVariants = cva(
	'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
)

const Label = ({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) => (
	<LabelPrimitive.Root
		data-slot="label"
		className={cn(labelVariants(), className)}
		{...props}
	/>
)

export { Label }
