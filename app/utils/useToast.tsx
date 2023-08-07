import { useEffect } from 'react'
import { toast } from '~/components/ui/use-toast.ts'
import { type ToastMessage } from './flash-session.server.ts'

export const useToast = (message?: ToastMessage) => {
	useEffect(() => {
		if (message) {
			toast({
				variant: message.variant,
				title: message.title,
				description: message.description,
			})
		}
	}, [message])
}
