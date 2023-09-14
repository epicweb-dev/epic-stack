import { Index as ConfettiShower } from 'confetti-react'
import { ClientOnly } from 'remix-utils'
import { useWindowSize } from '~/utils/useWindowSize.ts'

export function Confetti({ id }: { id?: string | null }) {
	if (!id) return null
	const { width, height } = useWindowSize()

	return (
		<ClientOnly>
			{() => (
				<ConfettiShower
					key={id}
					run={Boolean(id)}
					recycle={false}
					numberOfPieces={500}
					width={width}
					height={height}
				/>
			)}
		</ClientOnly>
	)
}
