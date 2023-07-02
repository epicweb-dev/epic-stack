import { rest } from 'msw'
import { setupServer } from 'msw/node'
import closeWithGrace from 'close-with-grace'
import { requiredHeader, writeEmail } from './utils.ts'
import { faker } from '@faker-js/faker'

const handlers = [
	process.env.REMIX_DEV_HTTP_ORIGIN
		? rest.post(`${process.env.REMIX_DEV_HTTP_ORIGIN}/ping`, req =>
				req.passthrough(),
		  )
		: null,

	// feel free to remove this conditional from the mock once you've set up resend
	process.env.RESEND_API_KEY
		? rest.post(`https://api.resend.com/emails`, async (req, res, ctx) => {
				requiredHeader(req.headers, 'Authorization')
				const body = await req.json()
				console.info('🔶 mocked email contents:', body)

				await writeEmail(body)

				return res(
					ctx.json({
						id: faker.string.uuid(),
						from: body.from,
						to: body.to,
						created_at: new Date().toISOString(),
					}),
				)
		  })
		: null,

	rest.post('https://api.openai.com/v1/chat/completions', req => {
		// TODO: properly mock this
		// I'm not certain how to do this with MSW. Maybe the new version with
		// the web fetch API can do it?
		return req.passthrough()
	}),
].filter(Boolean)

const server = setupServer(...handlers)

server.listen({ onUnhandledRequest: 'warn' })
console.info('🔶 Mock server installed')

closeWithGrace(() => {
	server.close()
})
