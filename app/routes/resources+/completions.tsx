import { type DataFunctionArgs } from '@remix-run/node'
import { eventStream } from 'remix-utils'
import {
	type ChatCompletionRequestMessage,
	Configuration,
	OpenAIApi,
} from 'openai'
import { authenticator, requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { invariantResponse } from '~/utils/misc.ts'

const openai = new OpenAIApi(
	new Configuration({
		apiKey: process.env.OPENAI_API_KEY,
	}),
)

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { name: true, username: true },
	})
	if (!user) {
		await authenticator.logout(request, { redirectTo: '/' })
		return new Response(null, { status: 401 })
	}

	const url = new URL(request.url)
	const title = url.searchParams.get('title')
	const content = url.searchParams.get('content')

	const name = user.name ?? user.username

	const messages: Array<ChatCompletionRequestMessage> | null = title
		? [
				{
					role: 'system',
					content: `You are a helpful assistant. The user will provide a title of a note and you will reply without pleasantries and only text that could be the contents of that note.`,
				},
				{
					role: 'user',
					content: title,
					name,
				},
		  ]
		: content
		? [
				{
					role: 'system',
					content: `You are a helpful assistant. The user will provide the contents of a note and you will reply without pleasantries and only text that could be the short title (or summary) of that note. Try to keep it terse. Do not use quotation marks. Here are some examples:\n\nShopping list\nTips and tricks for breathing\nBlending in as a robot\nHow to survive a zombie apocalyps`,
				},
				{
					role: 'user',
					content: `I have written the following note, what would be a good title for this? Please provide a single suggestion without quotation marks.\n\n${content}`,
					name,
				},
		  ]
		: null

	invariantResponse(messages, 'Must provide title or content')

	const response = await openai.createChatCompletion(
		{
			model: 'gpt-3.5-turbo', // can change to "gpt-4" if you fancy
			messages,
			temperature: 0.7,
			max_tokens: 1024,
			stream: true,
		},
		{ responseType: 'stream' },
	)
	const controller = new AbortController()
	request.signal.addEventListener('abort', () => {
		controller.abort()
	})

	return eventStream(controller.signal, function setup(send) {
		// @ts-expect-error 🤷‍♂️
		response.data.on('data', (data: any) => {
			const lines = data
				.toString()
				.split('\n')
				.filter((line: string) => line.trim() !== '')

			for (const line of lines) {
				const message = line.toString().replace(/^data: /, '')
				if (message === '[DONE]') {
					return // Stream finished
				}
				try {
					const parsed = JSON.parse(message) as any
					// newlines get stripped out of the stream, so we replace them with a placeholder
					const delta = parsed.choices[0].delta?.content?.replace(
						/\n/g,
						'__NEWLINE__',
					)
					if (delta) send({ data: delta })
				} catch (error) {
					console.error('Could not JSON parse stream message', message, error)
				}
			}
		})

		// @ts-expect-error 🤷‍♂️
		response.data.on('error', (error: any) => {
			console.error('Stream error', error)
		})

		// @ts-expect-error 🤷‍♂️
		response.data.on('end', () => {
			controller.abort()
		})

		return function clear() {}
	})
}
