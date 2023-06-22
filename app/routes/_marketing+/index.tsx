import type { V2_MetaFunction } from '@remix-run/node'
import { kodyRocket, logos, stars } from './logos/logos.ts'

export const meta: V2_MetaFunction = () => [{ title: 'Epic Notes' }]

export default function Index() {
	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
						<div className="absolute inset-0">
							<img className="h-full w-full object-cover" src={stars} alt="" />
							<div className="absolute inset-0 bg-[color:rgba(30,23,38,0.5)] mix-blend-multiply" />
						</div>
						<div className="lg:pt-18 relative px-4 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20">
							<h1 className="text-center text-mega font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
								<a
									className="block uppercase text-brand-tertiary drop-shadow-md"
									href="https://www.epicweb.dev/stack"
								>
									Epic Stack
								</a>
							</h1>
							<p className="mx-auto mt-6 max-w-lg text-center text-xl text-white sm:max-w-3xl">
								Check the{' '}
								<a
									className="underline"
									href="https://github.com/epicweb-dev/epic-stack/blob/main/docs/getting-started.md"
								>
									Getting Started
								</a>{' '}
								guide file for instructions on how to get your project off the
								ground!
							</p>
							<a href="https://www.epicweb.dev">
								<img
									src={kodyRocket}
									alt="Illustration of a Koala riding a rocket"
									className="mx-auto mt-8 w-full max-w-[12rem] md:max-w-[16rem]"
								/>
							</a>
						</div>
					</div>
				</div>

				<div className="mx-auto mt-8 max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
					<div className="flex flex-wrap justify-center gap-8 rounded-3xl bg-day-300 py-4">
						{logos.map(img => (
							<a
								key={img.href}
								href={img.href}
								className="flex h-16 w-32 justify-center p-1 grayscale transition hover:grayscale-0 focus:grayscale-0"
							>
								<img alt={img.alt} src={img.src} className="object-contain" />
							</a>
						))}
					</div>
				</div>
			</div>
		</main>
	)
}
