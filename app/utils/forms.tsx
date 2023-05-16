import Checkbox from '@radix-ui/react-checkbox/dist/index.js'
import { Link } from '@remix-run/react'
import { clsx } from 'clsx'
import React, { useEffect, useId, useRef } from 'react'
import { z } from 'zod'
import styles from './forms.module.css'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="space-y-1">
			{errorsToRender.map(e => (
				<li key={e} className="text-[10px] text-accent-red">
					{e}
				</li>
			))}
		</ul>
	)
}

export function useForm<Key extends string>({
	name,
	errors,
	ref: passedRef,
	fieldMetadatas,
}: {
	name: string
	fieldMetadatas: FieldMetadatas<Key>
	ref?: React.RefObject<HTMLFormElement>
	errors?: {
		formErrors?: ListOfErrors
		fieldErrors?: Record<string, ListOfErrors> | null
	} | null
}) {
	const defaultRef = useRef<HTMLFormElement>(null)
	const formRef = passedRef ?? defaultRef
	const errorElId = ['form', name, 'error'].join('-')
	const hasFormErrors = errors?.formErrors?.filter(Boolean).length
	const [hydrated, setHydrated] = React.useState(false)
	useEffect(() => {
		setHydrated(true)
	}, [])
	useFocusInvalid(formRef.current, errors)
	return {
		form: {
			props: {
				noValidate: hydrated,
				'aria-invalid': hasFormErrors ? true : undefined,
				'aria-describedby': hasFormErrors ? errorElId : undefined,
				tabIndex: hasFormErrors ? -1 : undefined,
				ref: formRef,
			},
			errorUI: hasFormErrors ? (
				<ErrorList errors={errors.formErrors} id={errorElId} />
			) : null,
		},
		fields: getFields(fieldMetadatas, errors?.fieldErrors),
	}
}

export function useFocusInvalid(
	formEl: HTMLFormElement | null,
	errors?: {
		formErrors?: Array<unknown> | null
		fieldErrors?: Record<string, Array<unknown> | null | undefined> | null
	} | null,
) {
	useEffect(() => {
		if (!formEl) return
		if (!errors) return
		const allErrors = [
			...(errors.formErrors?.filter(Boolean) ?? []),
			...(Object.values(errors.fieldErrors ?? {})
				?.flat()
				.filter(Boolean) ?? []),
		]
		if (!allErrors.length) return

		if (formEl.matches('[aria-invalid="true"]')) {
			formEl.focus()
		} else {
			for (const formElement of formEl.elements) {
				if (
					formElement.matches('[aria-invalid="true"]') &&
					formElement instanceof HTMLElement
				) {
					formElement.focus()
				}
			}
		}
	}, [formEl, errors])
}

// borrowed this from:
// - kiliman: https://github.com/kiliman/remix-params-helper/blob/e7e2c24f340622bce8a2ef8f61ee76bbe8281196/src/helper.ts
// - edmunhung: https://github.com/edmundhung/conform/blob/a598a2eb13fc2d41bd235c77231c6292a2682036/packages/conform-zod/index.ts

export type InputValidationProps = {
	required?: boolean
} & (
	| {
			type: 'text' | 'email' | 'url'
			minLength?: number
			maxLength?: number
			pattern?: string
	  }
	| {
			type: 'number'
			min?: number
			max?: number
	  }
	| {
			type: 'checkbox'
	  }
	| {
			type: 'date'
	  }
)

function getFieldProps(schema: z.ZodTypeAny): InputValidationProps {
	if (schema instanceof z.ZodEffects) {
		return {
			required: true,
			...getFieldProps(schema.innerType()),
		}
	} else if (schema instanceof z.ZodOptional) {
		return {
			...getFieldProps(schema.unwrap()),
			required: undefined,
		}
	} else if (schema instanceof z.ZodDefault) {
		return {
			...getFieldProps(schema.removeDefault()),
			required: undefined,
		}
	} else if (schema instanceof z.ZodArray) {
		throw new Error(`TODO: support arrays with field props`)
	} else if (schema instanceof z.ZodUnion) {
		const allProps: Array<InputValidationProps> = schema.options.map(
			(option: z.ZodTypeAny) => getFieldProps(option),
		)
		let type = allProps[0].type
		if (new Set(allProps.map(p => p.type)).size > 1) {
			// Make it the most loose type
			type = 'text'
		}
		if (new Set(allProps.map(p => p.required)).size > 1) {
			// Sorry future Kent. I just didn't know your use case...
			throw new Error('TODO: support unions with different required')
		}
		const required = allProps[0].required
		if (type === 'number') {
			const numberProps = allProps as Array<
				InputValidationProps & { type: 'number' }
			>
			const allMins = numberProps.map(p => p.min).filter(Boolean)
			const allMaxs = numberProps.map(p => p.max).filter(Boolean)
			return {
				type,
				required,
				min: allMins.length ? Math.min(...allMins) : undefined,
				max: allMaxs.length ? Math.max(...allMaxs) : undefined,
			}
		} else {
			const stringProps = allProps as Array<
				InputValidationProps & { type: 'text' | 'email' | 'url' }
			>
			const allMins = stringProps.map(p => p.minLength).filter(Boolean)
			const allMaxs = stringProps.map(p => p.maxLength).filter(Boolean)
			const allPatterns = stringProps.map(p => p.pattern).filter(Boolean)
			return {
				type,
				required,
				minLength: allMins.length ? Math.min(...allMins) : undefined,
				maxLength: allMaxs.length ? Math.max(...allMaxs) : undefined,
				pattern: allPatterns.length
					? allPatterns
							.map((option: string) =>
								// To escape unsafe characters on regex
								option
									.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
									.replace(/-/g, '\\x2d'),
							)
							.join('|')
					: undefined,
			}
		}
	} else if (schema instanceof z.ZodString) {
		let minLength: number | null = null,
			maxLength: number | null = null,
			pattern: string | null = null
		for (let check of schema._def.checks) {
			switch (check.kind) {
				case 'min':
					if (minLength === null || minLength < check.value) {
						minLength = check.value
					}
					break
				case 'max':
					if (maxLength === null || maxLength > check.value) {
						maxLength = check.value
					}
					break
				case 'regex':
					if (pattern === null) {
						pattern = check.regex.source
					}
					break
			}
		}
		return {
			type: schema.isEmail ? 'email' : schema.isURL ? 'url' : 'text',
			required: true,
			minLength: minLength ?? undefined,
			maxLength: maxLength ?? undefined,
			pattern: pattern ?? undefined,
		}
	} else if (schema instanceof z.ZodNumber) {
		let min: number | null = null,
			max: number | null = null
		for (let check of schema._def.checks) {
			switch (check.kind) {
				case 'min':
					if (min === null || min < check.value) {
						min = check.value
					}
					break
				case 'max':
					if (max === null || max > check.value) {
						max = check.value
					}
					break
			}
		}
		return {
			type: 'number',
			required: true,
			min: min ?? undefined,
			max: max ?? undefined,
		}
	} else if (schema instanceof z.ZodEnum) {
		return {
			type: 'text',
			required: true,
			pattern: schema.options
				.map((option: string) =>
					// To escape unsafe characters on regex
					option.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d'),
				)
				.join('|'),
		}
	} else if (schema instanceof z.ZodBoolean) {
		return { type: 'checkbox' }
	} else if (schema instanceof z.ZodDate) {
		return { type: 'date' }
	} else if (schema instanceof z.ZodLiteral) {
		return { required: true, type: 'text', pattern: schema._def.value }
	} else if (schema instanceof z.ZodAny) {
		// this is the best we can do.
		return { required: true, type: 'text' }
	}

	console.error(schema)

	throw new Error(`Unsupported type: ${schema}`)
}

function getShape<Schema extends z.ZodTypeAny>(schema: Schema) {
	// find actual shape definition
	let shape = schema
	while (shape instanceof z.ZodObject || shape instanceof z.ZodEffects) {
		shape =
			shape instanceof z.ZodObject
				? shape.shape
				: shape instanceof z.ZodEffects
				? shape._def.schema
				: null
		if (shape === null) {
			throw new Error(`Could not find shape`)
		}
	}
	return shape
}

export function preprocessSearchParams<Schema extends z.ZodTypeAny>(
	request: Request,
	schema: Schema,
) {
	const searchParams = new URL(request.url).searchParams
	const shape = getShape(schema)
	return mapObj(shape, ([name, propertySchema]) =>
		transformDataValueBasedOnSchema(
			getValueBasedOnSchema(searchParams, String(name), propertySchema),
			propertySchema,
		),
	)
}

export function preprocessFormData<Schema extends z.ZodTypeAny>(
	formData: FormData,
	schema: Schema,
) {
	const shape = getShape(schema)
	return mapObj(shape, ([name, propertySchema]) =>
		transformDataValueBasedOnSchema(
			getValueBasedOnSchema(formData, String(name), propertySchema),
			propertySchema,
		),
	)
}

function getValueBasedOnSchema<
	Value,
	Data extends {
		get: (key: string) => Value | null
		getAll: (key: string) => Array<Value>
	},
>(
	formData: Data,
	name: string,
	schema: z.ZodTypeAny,
): Value | Array<Value> | null | undefined {
	if (schema instanceof z.ZodEffects) {
		return getValueBasedOnSchema(formData, name, schema.innerType())
	} else if (schema instanceof z.ZodOptional) {
		return getValueBasedOnSchema(formData, name, schema.unwrap())
	} else if (schema instanceof z.ZodDefault) {
		return getValueBasedOnSchema(formData, name, schema.removeDefault())
	} else if (schema instanceof z.ZodArray) {
		return formData.getAll(name)
	} else {
		return formData.get(name)
	}
}

function transformDataValueBasedOnSchema(
	value: unknown,
	propertySchema: z.ZodTypeAny,
): unknown {
	if (propertySchema instanceof z.ZodEffects) {
		return transformDataValueBasedOnSchema(value, propertySchema.innerType())
	} else if (propertySchema instanceof z.ZodOptional) {
		return transformDataValueBasedOnSchema(value, propertySchema.unwrap())
	} else if (propertySchema instanceof z.ZodDefault) {
		return transformDataValueBasedOnSchema(
			value,
			propertySchema.removeDefault(),
		)
	} else if (propertySchema instanceof z.ZodArray) {
		if (!value || !Array.isArray(value)) {
			throw new Error('Expected array')
		}
		return value.map(v =>
			transformDataValueBasedOnSchema(v, propertySchema.element),
		)
	} else if (propertySchema instanceof z.ZodObject) {
		throw new Error('Support object types')
	} else if (propertySchema instanceof z.ZodBoolean) {
		return Boolean(value)
	} else if (propertySchema instanceof z.ZodNumber) {
		if (value === null || value === '') {
			return undefined
		} else {
			return Number(value)
		}
	} else if (propertySchema instanceof z.ZodString) {
		if (value === null) {
			return undefined
		} else {
			return String(value)
		}
	} else {
		return value
	}
}

function mapObj<Key extends string, Value, MappedValue>(
	obj: Record<Key, Value>,
	cb: (entry: [Key, Value]) => MappedValue,
): Record<Key, MappedValue> {
	return Object.entries(obj).reduce((acc, entry) => {
		acc[entry[0] as Key] = cb(entry as [Key, Value])
		return acc
	}, {} as Record<Key, MappedValue>)
}

export function getFieldsFromSchema<Schema extends z.ZodTypeAny>(
	schema: Schema,
) {
	const shape = getShape(schema)
	type Key = keyof z.infer<typeof shape>

	return Object.entries(shape).reduce((acc, entry) => {
		const [name, value] = entry as [Key, z.ZodTypeAny]
		acc[name] = getFieldProps(value)
		return acc
	}, {} as FieldMetadatas<Key>)
}

export type FieldMetadatas<Key extends string | number | symbol> = Record<
	Key,
	InputValidationProps
>

export function getFields<Key extends string>(
	fieldMetadatas: FieldMetadatas<Key>,
	allErrors?: Partial<Record<Key, ListOfErrors>> | null,
) {
	return mapObj(fieldMetadatas, ([name, props]) => {
		const id = `field-${name}`
		const errorElId = `field-${name}-error`
		const fieldErrors = allErrors?.[name] ?? []
		return {
			props: {
				...props,
				id,
				name,
				'aria-invalid': fieldErrors.length ? true : undefined,
				'aria-describedby': fieldErrors.length ? errorElId : undefined,
			},
			labelProps: { htmlFor: id },
			errors: fieldErrors,
			errorUI: fieldErrors.length ? (
				<ErrorList errors={fieldErrors} id={errorElId} />
			) : null,
		}
	})
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: Omit<JSX.IntrinsicElements['label'], 'className'>
	inputProps: Omit<JSX.IntrinsicElements['input'], 'className'>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={clsx(styles.field, className)}>
			<input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				placeholder=" "
				{...inputProps}
				className="h-16 w-full rounded-lg border border-night-400 bg-night-700 px-4 pt-4 text-body-xs caret-white outline-none focus:border-accent-purple disabled:bg-night-400"
			/>
			{/* the label comes after the input so we can use the sibling selector in the CSS to give us animated label control in CSS only */}
			<label htmlFor={id} {...labelProps} />
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: Omit<JSX.IntrinsicElements['label'], 'className'>
	textareaProps: Omit<JSX.IntrinsicElements['textarea'], 'className'>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={clsx(styles.textareaField, className)}>
			<textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				placeholder=" "
				{...textareaProps}
				className="h-48 w-full rounded-lg border border-night-400 bg-night-700 px-4 pt-8 text-body-xs caret-white outline-none focus:border-accent-purple disabled:bg-night-400"
			/>
			{/* the label comes after the input so we can use the sibling selector in the CSS to give us animated label control in CSS only */}
			<label htmlFor={id} {...labelProps} />
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
}: {
	labelProps: Omit<JSX.IntrinsicElements['label'], 'className'>
	buttonProps: Omit<
		React.ComponentPropsWithoutRef<typeof Checkbox.Root>,
		'type' | 'className'
	> & {
		type?: string
	}
	errors?: ListOfErrors
}) {
	const fallbackId = useId()
	const id = buttonProps.id ?? buttonProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={styles.checkboxField}>
			<div className="flex gap-2">
				<Checkbox.Root
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					{...buttonProps}
					type="button"
				>
					<Checkbox.Indicator className="h-4 w-4">
						<svg viewBox="0 0 8 8">
							<path
								d="M1,4 L3,6 L7,2"
								stroke="black"
								strokeWidth="1"
								fill="none"
							/>
						</svg>
					</Checkbox.Indicator>
				</Checkbox.Root>
				<label
					htmlFor={id}
					{...labelProps}
					className="text-body-xs text-night-200"
				/>
			</div>
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function getButtonClassName({
	size,
	variant,
}: {
	size: 'xs' | 'sm' | 'md' | 'md-wide' | 'pill'
	variant: 'primary' | 'secondary'
}) {
	const baseClassName =
		'flex justify-center items-center rounded-full font-bold outline-none transition-[background-color,color] duration-200 disabled:bg-night-500 disabled:text-night-200'
	const primaryClassName =
		'bg-accent-purple hover:bg-accent-yellow hover:text-night-700 focus:bg-accent-yellow focus:text-night-700 active:bg-accent-yellow-muted'
	const secondaryClassName =
		'border-[1.5px] border-night-400 bg-night-700 hover:border-accent-purple focus:border-accent-purple active:border-accent-purple-lighter'
	const extraSmallClassName = 'py-2 px-3 text-body-xs'
	const smallClassName = 'px-10 py-[14px] text-body-xs'
	const mediumClassName = 'px-14 py-5 text-lg'
	const mediumWideClassName = 'px-24 py-5 text-lg'
	const pillClassName = 'px-12 py-3 leading-3'
	const className = clsx(baseClassName, {
		[primaryClassName]: variant === 'primary',
		[secondaryClassName]: variant === 'secondary',
		[extraSmallClassName]: size === 'xs',
		[smallClassName]: size === 'sm',
		[mediumClassName]: size === 'md',
		[mediumWideClassName]: size === 'md-wide',
		[pillClassName]: size === 'pill',
	})
	return className
}

export function Button({
	size,
	variant,
	status = 'idle',
	...props
}: React.ComponentPropsWithoutRef<'button'> &
	Parameters<typeof getButtonClassName>[0] & {
		status?: 'pending' | 'success' | 'error' | 'idle'
	}) {
	const companion = {
		pending: <span className="inline-block animate-spin">🌀</span>,
		success: <span>✅</span>,
		error: <span>❌</span>,
		idle: null,
	}[status]
	return (
		<button
			{...props}
			className={clsx(
				props.className,
				getButtonClassName({ size, variant }),
				'flex justify-center gap-4',
			)}
		>
			<div>{props.children}</div>
			{companion}
		</button>
	)
}

export function ButtonLink({
	size,
	variant,
	...props
}: Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'> &
	Parameters<typeof getButtonClassName>[0]) {
	// eslint-disable-next-line jsx-a11y/anchor-has-content
	return <Link {...props} className={getButtonClassName({ size, variant })} />
}

export function LabelButton({
	size,
	variant,
	...props
}: Omit<React.ComponentPropsWithoutRef<'label'>, 'className'> &
	Parameters<typeof getButtonClassName>[0]) {
	return (
		<label
			{...props}
			className={clsx('cursor-pointer', getButtonClassName({ size, variant }))}
		/>
	)
}
