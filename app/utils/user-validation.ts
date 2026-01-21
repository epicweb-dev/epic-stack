import { z } from 'zod'

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20

export const UsernameSchema = z
	.string()
	.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Username is required',
			})
			return
		}
		if (value.length < USERNAME_MIN_LENGTH) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Username is too short',
			})
		}
		if (value.length > USERNAME_MAX_LENGTH) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Username is too long',
			})
		}
		if (!/^[a-zA-Z0-9_]+$/.test(value)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Username can only include letters, numbers, and underscores',
			})
		}
	})
	// users can type the username in any case, but we store it in lowercase
	.transform((value) => value?.toLowerCase() ?? '')

export const PasswordSchema = z
	.string()
	.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Password is required',
			})
			return
		}
		if (value.length < 6) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Password is too short',
			})
		}
		// NOTE: bcrypt has a limit of 72 bytes (which should be plenty long)
		// https://github.com/epicweb-dev/epic-stack/issues/918
		if (new TextEncoder().encode(value).length > 72) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Password is too long',
			})
		}
	})
	.transform((value) => value ?? '')

export const NameSchema = z
	.string()
	.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Name is required',
			})
			return
		}
		if (value.length < 3) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Name is too short',
			})
		}
		if (value.length > 40) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Name is too long',
			})
		}
	})
	.transform((value) => value ?? '')

export const EmailSchema = z
	.string()
	.optional()
	.superRefine((value, ctx) => {
		if (!value) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Email is required',
			})
			return
		}
		if (value.length < 3) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Email is too short',
			})
		}
		if (value.length > 100) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Email is too long',
			})
		}
		if (!z.string().email().safeParse(value).success) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Email is invalid',
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
