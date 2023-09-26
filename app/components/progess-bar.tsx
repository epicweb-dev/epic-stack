import { useNavigation } from '@remix-run/react'
import React, { useEffect, useRef, useState } from 'react'
import { useSpinDelay } from 'spin-delay'
import { cn } from '#app/utils/misc.tsx'
import { Spinner } from './spinner.tsx'

function EpicProgress() {
	const transition = useNavigation()
	const busy = transition.state !== 'idle'
	const delayedPending = useSpinDelay(busy, {
		delay: 400,
		minDuration: 300,
	})
	const ref = useRef<HTMLDivElement>(null)
	const [animationComplete, setAnimationComplete] = useState(true)

	useEffect(() => {
		if (!ref.current) return
		if (delayedPending) setAnimationComplete(false)

		const animationPromises = ref.current
			.getAnimations()
			.map(({ finished }) => finished)

		Promise.allSettled(animationPromises).then(() => {
			if (!delayedPending) setAnimationComplete(true)
		})
	}, [delayedPending])

	return (
		<div
			role="progressbar"
			aria-hidden={!delayedPending}
			aria-valuetext={delayedPending ? 'Loading' : undefined}
			className="fixed inset-x-0 left-0 top-0 z-50 h-[0.20rem] animate-pulse"
		>
			<div
				ref={ref}
				className={cn(
					'h-full bg-blue-600 transition-all duration-300 ease-in-out',
					transition.state === 'idle' &&
						animationComplete &&
						'w-0 opacity-0 transition-none',
					transition.state === 'submitting' && 'w-1/12',
					transition.state === 'loading' && 'w-2/12',
					transition.state === 'idle' && !animationComplete && 'w-full',
				)}
			/>
			{delayedPending && (
				<div className="absolute inset-0 flex items-center justify-center">
					<Spinner showSpinner={true} className="text-blue-600" />
				</div>
			)}
		</div>
	)
}

export { EpicProgress }
