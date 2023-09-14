import { Index as ConfettiShower } from 'confetti-react'
import { ClientOnly } from 'remix-utils'
import { useWindowSize } from '~/utils/useWindowSize.ts'

/**
 * confetti is a unique random identifier which re-renders the component
 */
export function Confetti({ confetti }: { confetti?: string }) {
	const { width, height } = useWindowSize()

	return (
		<ClientOnly>
			{() => (
				<ConfettiShower
					key={confetti}
					run={Boolean(confetti)}
					recycle={false}
					numberOfPieces={500}
					width={width}
					height={height}
				/>
			)}
		</ClientOnly>
	)
}
