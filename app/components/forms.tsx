import { FieldMetadata, useInputControl } from '@conform-to/react'
import { REGEXP_ONLY_DIGITS_AND_CHARS, type OTPInputProps } from 'input-otp'
import React, { useId, useState } from 'react'
import { Checkbox, type CheckboxProps } from './ui/checkbox'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from './ui/input-otp'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select'
import { Textarea } from './ui/textarea'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandDialog,
} from '#app/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover'
import { Icon } from '#app/components/ui/icon'
import { cn } from '#app/utils/misc'

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
			{errorsToRender.map((e) => (
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

export function SelectField({
	labelProps,
	selectProps,
	selectOptions,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	selectProps: {
		name?: string
		placeholder?: string
		disabled?: boolean
		onValueChange?: (value: string) => void
	}
	selectOptions?: { value: string; label: string }[]
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = selectProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const placeholder = selectProps?.placeholder || 'Select'

	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Select {...selectProps}>
				<SelectTrigger
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{selectOptions?.map((option) => (
						<SelectItem
							key={`${id}-${option.value}`}
							value={option.value}
							className="hover:bg-primary/10"
						>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function OTPField({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: Partial<OTPInputProps & { render: never }>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<InputOTP
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
				maxLength={6}
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			>
				<InputOTPGroup>
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={3} />
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>
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
					onCheckedChange={(state) => {
						input.change(state.valueOf() ? checkedValue : '')
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={(event) => {
						input.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={(event) => {
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

// Add an input for the type="time" input. Should model the Field component.
export function TimeField({
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
				type="time"
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

export function NumberField({
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
				type="number"
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

export function ComboboxField({
	labelProps,
	buttonProps,
	comboboxProps,
	comboboxOptions,
	errors,
	className,
	field,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
	comboboxProps: {
		name: string
		placeholder?: string
		emptyText?: string | JSX.Element
	}
	comboboxOptions: { value: string; label: string }[]
	errors?: ListOfErrors
	className?: string
	field: FieldMetadata<string>
}) {
	const [open, setOpen] = useState(false)
	const control = useInputControl(field)
	const fallbackId = useId()
	const id = comboboxProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						{...buttonProps}
						variant="outline"
						role="combobox"
						aria-expanded={open}
						aria-invalid={errorId ? true : undefined}
						aria-describedby={errorId}
						className="w-full justify-between"
					>
						{control.value
							? comboboxOptions.find((option) => option.value === control.value)
									?.label
							: comboboxProps.placeholder || 'Select...'}
						<Icon name="caret-sort" className="ml-2 shrink-0" />
					</Button>
				</PopoverTrigger>

				<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
					<Command
						filter={(value, search) => {
							const item = comboboxOptions.find((item) => item.value === value)
							if (!item) return 0
							if (item.label.toLowerCase().includes(search.toLowerCase()))
								return 1

							return 0
						}}
					>
						<CommandInput placeholder="Search..." />
						<CommandList>
							<CommandEmpty>
								{comboboxProps.emptyText || 'No options found.'}
							</CommandEmpty>
							<CommandGroup>
								{comboboxOptions.map((option) => (
									<CommandItem
										key={option.value}
										value={option.value}
										onSelect={(currentValue) => {
											control.change(currentValue)
											setOpen(false)
										}}
									>
										<Icon
											name="check"
											className={cn(
												'mr-2 h-4 w-4',
												control.value === option.value
													? 'opacity-100'
													: 'opacity-0',
											)}
										/>
										{option.label}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
