import { z } from 'zod'

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20

const BaseUsernameSchema = z
	.string()
	.min(USERNAME_MIN_LENGTH, { message: 'Username is too short' })
	.max(USERNAME_MAX_LENGTH, { message: 'Username is too long' })
	.regex(/^[a-zA-Z0-9_]+$/, {
		message: 'Username can only include letters, numbers, and underscores',
	})

export const UsernameSchema = BaseUsernameSchema.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Username is required',
			})
		}
	})
	// users can type the username in any case, but we store it in lowercase
	.transform((value) => value?.toLowerCase() ?? '')

const BasePasswordSchema = z
	.string()
	.min(6, { message: 'Password is too short' })
	// NOTE: bcrypt has a limit of 72 bytes (which should be plenty long)
	// https://github.com/epicweb-dev/epic-stack/issues/918
	.refine((val) => new TextEncoder().encode(val).length <= 72, {
		message: 'Password is too long',
	})

export const PasswordSchema = BasePasswordSchema.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Password is required',
			})
		}
	})
	.transform((value) => value ?? '')

const BaseNameSchema = z
	.string()
	.min(3, { message: 'Name is too short' })
	.max(40, { message: 'Name is too long' })

export const NameSchema = BaseNameSchema.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Name is required',
			})
		}
	})
	.transform((value) => value ?? '')

const BaseEmailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	.min(3, { message: 'Email is too short' })
	.max(100, { message: 'Email is too long' })

export const EmailSchema = BaseEmailSchema.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Email is required',
			})
		}
	})
	// users can type the email in any case, but we store it in lowercase
	.transform((value) => value?.toLowerCase() ?? '')

export const PasswordAndConfirmPasswordSchema = z
	.object({ password: PasswordSchema, confirmPassword: PasswordSchema })
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				path: ['confirmPassword'],
				code: 'custom',
				message: 'The passwords must match',
			})
		}
	})
