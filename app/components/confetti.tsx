import { Index as ConfettiShower, type Props } from 'confetti-react'
import { ClientOnly } from 'remix-utils'

interface ConfettiProps extends Props {
	confetti?: string
}

export const Confetti = ({ confetti }: ConfettiProps) => {
	// Needs to be run client only
	return (
		<ClientOnly>
			{() => (
				<ConfettiShower
					// confetti is a unique random identifier which re-renders the component
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
