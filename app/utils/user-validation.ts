import { z } from 'zod'

export const usernameSchema = z
	.string()
	.min(3, { message: 'Username is too short' })
	.max(20, { message: 'Username is too long' })
export const passwordSchema = z
	.string()
	.min(6, { message: 'Password is too short' })
	.max(100, { message: 'Password is too long' })
export const nameSchema = z
	.string()
	.min(3, { message: 'Name is too short' })
	.max(40, { message: 'Name is too long' })
export const emailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	.min(3, { message: 'Email is too short' })
	.max(100, { message: 'Email is too long' })
