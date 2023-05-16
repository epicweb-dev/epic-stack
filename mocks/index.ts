import { rest } from 'msw'
import { setupServer } from 'msw/node'
import closeWithGrace from 'close-with-grace'
import { requiredHeader, writeEmail } from './utils.ts'

const handlers = [
	process.env.REMIX_DEV_HTTP_ORIGIN
		? rest.post(`${process.env.REMIX_DEV_HTTP_ORIGIN}/ping`, req =>
				req.passthrough(),
		  )
		: null,
	process.env.MAILGUN_DOMAIN
		? rest.post(
				`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
				async (req, res, ctx) => {
					requiredHeader(req.headers, 'Authorization')
					const body = Object.fromEntries(new URLSearchParams(await req.text()))
					console.info('🔶 mocked email contents:', body)

					await writeEmail(body)

					const randomId = '20210321210543.1.E01B8B612C44B41B'
					const id = `<${randomId}>@${req.params.domain}`
					return res(ctx.json({ id, message: 'Queued. Thank you.' }))
				},
		  )
		: null,
].filter(Boolean)

const server = setupServer(...handlers)

server.listen({ onUnhandledRequest: 'warn' })
console.info('🔶 Mock server installed')

closeWithGrace(() => {
	server.close()
})
