import { http, HttpResponse } from 'msw'

export const pwnedPasswordApiHandlers = [
	http.get('https://api.pwnedpasswords.com/range/:prefix', () => {
		return new HttpResponse('', { status: 200 })
	}),
]
