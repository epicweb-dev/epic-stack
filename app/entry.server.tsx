import 'dotenv/config'
import { PassThrough, Transform } from 'stream'
import { Response, type HandleDocumentRequestFunction } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import isbot from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { init, getEnv } from './utils/env.server.ts'
import { getInstanceInfo } from 'litefs-js'
import { NonceProvider } from './utils/nonce-provider.ts'

const ABORT_DELAY = 5000

init()
global.ENV = getEnv()

type DocRequestArgs = Parameters<HandleDocumentRequestFunction>

export default async function handleRequest(
	...args: DocRequestArgs
) {
  const [
    request,
    responseStatusCode,
    responseHeaders,
    remixContext,
    loadContext,
  ] = args
	const { currentInstance, primaryInstance } = await getInstanceInfo()
	responseHeaders.set('fly-region', process.env.FLY_REGION ?? 'unknown')
	responseHeaders.set('fly-app', process.env.FLY_APP_NAME ?? 'unknown')
	responseHeaders.set('fly-primary-instance', primaryInstance)
	responseHeaders.set('fly-instance', currentInstance)

	const callbackName = isbot(request.headers.get('user-agent'))
		? 'onAllReady'
		: 'onShellReady'

  const nonce = String(loadContext.cspNonce) ?? undefined
	return new Promise((resolve, reject) => {
		let didError = false

		const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <RemixServer context={remixContext} url={request.url} />
      </NonceProvider>,
			{
        nonce,
        [callbackName]: () => {
          const body = new PassThrough()
					responseHeaders.set('Content-Type', 'text/html')
          const dataEvtTransform = new Transform({
            transform(chunk, _, callback) {
              const string = chunk.toString()
              const replaced = string.replace(/data-evt-/g, `nonce="${nonce}" `)
              callback(null, replaced)
            },
          })
          pipe(dataEvtTransform).pipe(body)
					resolve(
						new Response(body, {
							headers: responseHeaders,
							status: didError ? 500 : responseStatusCode,
						}),
					)
				},
				onShellError: (err: unknown) => {
					reject(err)
				},
				onError: (error: unknown) => {
					didError = true

					console.error(error)
				},
			},
		)

		setTimeout(abort, ABORT_DELAY)
	})
}

export async function handleDataRequest(response: Response) {
	const { currentInstance, primaryInstance } = await getInstanceInfo()
	response.headers.set('fly-region', process.env.FLY_REGION ?? 'unknown')
	response.headers.set('fly-app', process.env.FLY_APP_NAME ?? 'unknown')
	response.headers.set('fly-primary-instance', primaryInstance)
	response.headers.set('fly-instance', currentInstance)

	return response
}
