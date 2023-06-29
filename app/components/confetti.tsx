import { Index as ConfettiShower, type Props } from 'confetti-react'
import { useEffect, useState } from 'react'

interface ConfettiProps extends Props {
	confetti?: string
}

let hydrating = true

function useHydrated() {
	let [hydrated, setHydrated] = useState(() => !hydrating)

	useEffect(function hydrate() {
		hydrating = false
		setHydrated(true)
	}, [])

	return hydrated
}

export const Confetti = ({ confetti }: ConfettiProps) => {
	const hydrated = useHydrated()

	// Needs to be run client only
	return hydrated ? (
		<ConfettiShower
			// confetti is a unique random identifier which re-renders the component
			key={confetti}
			run={Boolean(confetti)}
			recycle={false}
			numberOfPieces={500}
			width={window.innerWidth}
			height={window.innerHeight}
		/>
	) : null
}
