import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function getUserImgSrc(imageId?: string | null) {
	return imageId ? `/resources/file/${imageId}` : `/img/user.png`
}

export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
