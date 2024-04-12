import { useInputControl } from '@conform-to/react'
import React, { useId } from 'react'

import { Checkbox, type CheckboxProps } from '#/app/components/ui/checkbox.tsx'
import { Input } from '#/app/components/ui/input.tsx'
import { Label } from '#/app/components/ui/label.tsx'
import { Textarea } from '#/app/components/ui/textarea.tsx'

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
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map(e => (
				<li key={e} className="text-[10px] text-foreground-destructive">
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
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
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
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
	className,
}: {
	labelProps: JSX.IntrinsicElements['label']
	buttonProps: CheckboxProps & {
		name: string
		form: string
		value?: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const { key, defaultChecked, ...checkboxProps } = buttonProps
	const fallbackId = useId()
	const checkedValue = buttonProps.value ?? 'on'
	const input = useInputControl({
		key,
		name: buttonProps.name,
		formId: buttonProps.form,
		initialValue: defaultChecked ? checkedValue : undefined,
	})
	const id = buttonProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={className}>
			<div className="flex gap-2">
				<Checkbox
					{...checkboxProps}
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					checked={input.value === checkedValue}
					onCheckedChange={state => {
						input.change(state.valueOf() ? checkedValue : '')
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={event => {
						input.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={event => {
						input.blur()
						buttonProps.onBlur?.(event)
					}}
					type="button"
				/>
				<label
					htmlFor={id}
					{...labelProps}
					className="self-center text-body-xs text-muted-foreground"
				/>
			</div>
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
