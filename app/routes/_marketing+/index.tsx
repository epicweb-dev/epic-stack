import type { V2_MetaFunction } from '@remix-run/node'

export const meta: V2_MetaFunction = () => [{ title: 'Epic Notes' }]

export default function Index() {
	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
						<div className="absolute inset-0">
							<img
								className="h-full w-full object-cover"
								src="https://user-images.githubusercontent.com/1500684/236281980-66d33a85-f5fc-4094-ab73-e8994acc27a3.jpg"
								alt=""
							/>
							<div className="absolute inset-0 bg-[color:rgba(30,23,38,0.5)] mix-blend-multiply" />
						</div>
						<div className="lg:pt-18 relative px-4 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20">
							<h1 className="text-center text-mega font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
								<a
									className="block uppercase text-accent-pink drop-shadow-md"
									href="https://www.epicweb.dev/stack"
								>
									Epic Stack
								</a>
							</h1>
							<p className="mx-auto mt-6 max-w-lg text-center text-xl text-white sm:max-w-3xl">
								Check the README.md file for instructions on how to get this
								project deployed.
							</p>
							<a href="https://www.epicweb.dev">
								<img
									src="https://user-images.githubusercontent.com/1500684/236284990-8f98679b-6fc2-4f7a-9a8f-ea3f5b32d56e.png"
									alt="Illustration of a Koala riding a rocket"
									className="mx-auto mt-8 w-full max-w-[12rem] md:max-w-[16rem]"
								/>
							</a>
						</div>
					</div>
				</div>

				<div className="mx-auto mt-8 max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
					<div className="flex flex-wrap justify-center gap-8 rounded-3xl bg-day-300 py-4">
						{[
							{
								src: 'https://user-images.githubusercontent.com/1500684/157764397-ccd8ea10-b8aa-4772-a99b-35de937319e1.svg',
								alt: 'Fly.io',
								href: 'https://fly.io',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157764395-137ec949-382c-43bd-a3c0-0cb8cb22e22d.svg',
								alt: 'SQLite',
								href: 'https://sqlite.org',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157764484-ad64a21a-d7fb-47e3-8669-ec046da20c1f.svg',
								alt: 'Prisma',
								href: 'https://prisma.io',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157764276-a516a239-e377-4a20-b44a-0ac7b65c8c14.svg',
								alt: 'Tailwind',
								href: 'https://tailwindcss.com',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/236356419-d02acd65-0123-46e3-9891-27a36eb55d28.svg',
								alt: 'Playwright',
								href: 'https://playwright.dev/',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157772386-75444196-0604-4340-af28-53b236faa182.svg',
								alt: 'MSW',
								href: 'https://mswjs.io',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157772447-00fccdce-9d12-46a3-8bb4-fac612cdc949.svg',
								alt: 'Vitest',
								href: 'https://vitest.dev',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157772662-92b0dd3a-453f-4d18-b8be-9fa6efde52cf.png',
								alt: 'Testing Library',
								href: 'https://testing-library.com',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/236356589-fd6ad6e6-9510-4ff3-91ad-4836ca1c64f5.png',
								alt: 'Docker',
								href: 'https://www.docker.com',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157772934-ce0a943d-e9d0-40f8-97f3-f464c0811643.svg',
								alt: 'Prettier',
								href: 'https://prettier.io',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157772990-3968ff7c-b551-4c55-a25c-046a32709a8e.svg',
								alt: 'ESLint',
								href: 'https://eslint.org',
							},
							{
								src: 'https://user-images.githubusercontent.com/1500684/157773063-20a0ed64-b9f8-4e0b-9d1e-0b65a3d4a6db.svg',
								alt: 'TypeScript',
								href: 'https://typescriptlang.org',
							},
						].map(img => (
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
