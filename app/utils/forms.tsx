import { useInputEvent } from '@conform-to/react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Link } from '@remix-run/react'
import React, { useId, useRef } from 'react'
import styles from './forms.module.css'
import { twMerge } from 'tailwind-merge'

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
		<div className={twMerge(styles.field, className)}>
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
		<div className={twMerge(styles.textareaField, className)}>
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
	buttonProps: Omit<JSX.IntrinsicElements['input'], 'className'>
	errors?: ListOfErrors
}) {
	const fallbackId = useId()
	const id = buttonProps.id ?? buttonProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	// To emulate naitve input events that Conform listen to:
	// See https://conform.guide/integrations
	const [ref, control] = useInputEvent()
	const buttonRef = useRef<HTMLButtonElement>(null)
	return (
		<div className={styles.checkboxField}>
			<input
				{...buttonProps}
				ref={ref}
				id={undefined /* buttonProps.id should be assigned to the Radix checkbox instead */}
				autoComplete="off"
				className="sr-only"
				aria-hidden
				tabIndex={-1}
				onFocus={() => buttonRef.current?.focus()}
			/>
			<div className="flex gap-2">
				<Checkbox.Root
					id={id}
					ref={buttonRef}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					defaultChecked={buttonProps.defaultChecked}
					onCheckedChange={state => {
						if (ref.current && ref.current.checked !== Boolean(state.valueOf())) {
							ref.current.click()
						}
					}}
					onFocus={control.focus}
					onBlur={control.blur}
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
					className="self-center text-body-xs text-night-200"
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
	const className = twMerge(
		baseClassName,
		variant === 'primary' && primaryClassName,
		variant === 'secondary' && secondaryClassName,
		size === 'xs' && extraSmallClassName,
		size === 'sm' && smallClassName,
		size === 'md' && mediumClassName,
		size === 'md-wide' && [mediumWideClassName],
		size === 'pill' && pillClassName,
	)
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
			className={twMerge(
				getButtonClassName({ size, variant }),
				'flex justify-center gap-4',
				props.className,
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
}: React.ComponentPropsWithoutRef<typeof Link> &
	Parameters<typeof getButtonClassName>[0]) {
	return (
		// eslint-disable-next-line jsx-a11y/anchor-has-content
		<Link
			{...props}
			className={twMerge(
				getButtonClassName({ size, variant }),
				props.className,
			)}
		/>
	)
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
			className={twMerge(
				getButtonClassName({ size, variant }),
				'cursor-pointer',
			)}
		/>
	)
}
