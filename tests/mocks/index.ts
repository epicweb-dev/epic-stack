import closeWithGrace from 'close-with-grace'
import { setupServer } from 'msw/node'
import { handlers as githubHandlers } from './github.ts'
import { handlers as resendHandlers } from './resend.ts'

export const server = setupServer(...resendHandlers, ...githubHandlers)

server.listen({
  onUnhandledRequest(request, print) {
    // Do not print warnings on unhandled requests to Sentry.
    if (request.url.includes('.sentry.io')) {
      return
    }

    // Print the regular MSW unhandled request warning otherwise.
    print.warning()
  }
})

if (process.env.NODE_ENV !== 'test') {
	console.info('🔶 Mock server installed')

	closeWithGrace(() => {
		server.close()
	})
}
