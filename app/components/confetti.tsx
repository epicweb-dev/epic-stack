import { Index as ConfettiShower } from 'confetti-react'
import { ClientOnly } from 'remix-utils'

/**
 * confetti is a unique random identifier which re-renders the component
 */
export function Confetti({ confetti }: { confetti?: string }) {
	if (!confetti) return null

	return (
		<ClientOnly>
			{() => (
				<ConfettiShower
					key={confetti}
					run={Boolean(confetti)}
					recycle={false}
					numberOfPieces={500}
					width={window.innerWidth}
					height={window.innerHeight}
				/>
			)}
		</ClientOnly>
	)
}
