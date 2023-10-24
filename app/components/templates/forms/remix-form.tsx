// https://remix.run/docs/en/main/components/form

import { Form } from '@remix-run/react'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const remixFormVariants = cva('', {
	variants: {
		variant: {
			default: '',
			page: 'flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
export type EncType =
	| 'multipart/form-data'
	| 'application/x-www-form-urlencoded'
	| 'text/plain'

export interface RemixFormProps
	extends React.HTMLAttributes<HTMLFormElement>,
		VariantProps<typeof remixFormVariants> {
	asChild?: boolean
	action?: string
	method?: Method
	encType?: EncType
	preventScrollReset?: boolean
	replace?: boolean
	reloadDocument?: boolean
}

const RemixForm = React.forwardRef<HTMLFormElement, RemixFormProps>(
	(
		{
			className,
			variant,
			asChild = false,
			method = 'post',
			encType,
			action,
			preventScrollReset,
			replace,
			reloadDocument,
			...props
		},
		ref,
	) => {
		if (ref && typeof ref !== 'function') {
			throw new Error('Ref must be a function')
		}

		return (
			<Form
				className={cn(remixFormVariants({ variant, className }))}
				action={action}
				method={method}
				encType={encType}
				preventScrollReset={preventScrollReset}
				replace={replace}
				reloadDocument={reloadDocument}
				ref={ref}
				{...props}
			/>
		)
	},
)
RemixForm.displayName = 'RemixForm'

export { RemixForm, remixFormVariants }
