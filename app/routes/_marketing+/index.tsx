import { type V2_MetaFunction } from '@remix-run/node'
import meme from './weabdev.webp'

export const meta: V2_MetaFunction = () => [
	{ title: 'weab.dev' },
	{
		name: 'description',
		content: `Learn to code like a weab and build amazing websites! Our guides are packed with anime references and cultural knowledge, so you'll be sure to have a fun time learning. Become a master weab developer and create websites that will make your waifus proud!`,
	},
]

export default function Index() {
	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
						{/* <div className="absolute inset-0">
							<img className="h-full w-full object-contain" src={meme} alt="" />
							<div className="absolute inset-0 bg-[color:rgba(30,23,38,0.5)] mix-blend-multiply" />
						</div> */}
						<div className="lg:pt-18 relative px-4 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20">
							<a href="https://web.dev">
								<img
									className="h-full w-full object-contain"
									src={meme}
									alt=""
								/>
							</a>
						</div>
					</div>
				</div>

				{/* <div className="mx-auto mt-8 max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
					<div className="flex flex-wrap justify-center gap-8 rounded-3xl bg-slate-100 py-4 dark:bg-slate-200">
						<TooltipProvider>
							{logos.map(img => (
								<Tooltip key={img.href}>
									<TooltipTrigger asChild>
										<a
											href={img.href}
											className="flex h-16 w-32 justify-center p-1 grayscale transition hover:grayscale-0 focus:grayscale-0"
										>
											<img
												alt={img.alt}
												src={img.src}
												className="object-contain"
											/>
										</a>
									</TooltipTrigger>
									<TooltipContent>{img.alt}</TooltipContent>
								</Tooltip>
							))}
						</TooltipProvider>
					</div>
				</div> */}
			</div>
		</main>
	)
}
