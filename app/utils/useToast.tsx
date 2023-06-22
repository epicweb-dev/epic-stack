import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { type ToastMessage } from './flash-session.server.ts'

export const useToast = (message?: ToastMessage) => {
	useEffect(() => {
		if (message) {
			toast(message.text, { type: message.type })
		}
	}, [message])
}
