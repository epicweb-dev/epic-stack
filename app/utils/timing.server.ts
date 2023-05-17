import { type CreateReporter } from 'cachified'

export type Timings = Record<
	string,
	Array<{ desc?: string; type: string; time: number }>
>

function createTimer(type: string, desc?: string) {
	const start = performance.now()
	return {
		end(timings: Timings) {
			let timingType = timings[type]

			if (!timingType) {
				// eslint-disable-next-line no-multi-assign
				timingType = timings[type] = []
			}
			timingType.push({ desc, type, time: performance.now() - start })
		},
	}
}

export async function time<ReturnType>(
	fn: Promise<ReturnType> | (() => ReturnType | Promise<ReturnType>),
	{
		type,
		desc,
		timings,
	}: {
		type: string
		desc?: string
		timings?: Timings
	},
): Promise<ReturnType> {
	const timer = createTimer(type, desc)
	const promise = typeof fn === 'function' ? fn() : fn
	if (!timings) return promise

	const result = await promise

	timer.end(timings)
	return result
}

export function getServerTimeHeader(timings: Timings) {
	return Object.entries(timings)
		.map(([key, timingInfos]) => {
			const dur = timingInfos
				.reduce((acc, timingInfo) => acc + timingInfo.time, 0)
				.toFixed(1)
			const desc = timingInfos
				.map(t => t.desc)
				.filter(Boolean)
				.join(' & ')
			return [
				key.replaceAll(/(:| |@|=|;|,)/g, '_'),
				desc ? `desc=${JSON.stringify(desc)}` : null,
				`dur=${dur}`,
			]
				.filter(Boolean)
				.join(';')
		})
		.join(',')
}

export function cachifiedTimingReporter<Value>(
	timings?: Timings,
): undefined | CreateReporter<Value> {
	if (!timings) return

	return ({ key }) => {
		const cacheRetrievalTimer = createTimer(
			`cache:${key}`,
			`${key} cache retrieval`,
		)
		let getFreshValueTimer: ReturnType<typeof createTimer> | undefined
		return event => {
			switch (event.name) {
				case 'getFreshValueStart':
					getFreshValueTimer = createTimer(
						`getFreshValue:${key}`,
						`request forced to wait for a fresh ${key} value`,
					)
					break
				case 'getFreshValueSuccess':
					getFreshValueTimer?.end(timings)
					break
				case 'done':
					cacheRetrievalTimer.end(timings)
					break
			}
		}
	}
}
