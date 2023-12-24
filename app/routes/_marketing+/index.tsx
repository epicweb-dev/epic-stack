import { type MetaFunction } from '@remix-run/node'
import { motion } from 'framer-motion'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { cn } from '#app/utils/misc.tsx'
import { logos } from './logos/logos.ts'

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

export default function Index() {
	return (
		<main className="relative h-full sm:flex sm:items-center sm:justify-center">
			<div className="font-poppins grid place-items-center">
				<div className="grid place-items-center px-4 py-16 xl:grid-cols-2 xl:gap-24">
					<div className="xl:order-2">
						<div className="flex max-w-md flex-col items-center text-center xl:items-start xl:text-left">
							<a href="https://www.epicweb.dev/stack">
								<svg
									className="size-20 text-foreground xl:-mt-4"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 65 65"
								>
									<path
										fill="currentColor"
										d="M39.445 25.555 37 17.163 65 0 47.821 28l-8.376-2.445Zm-13.89 0L28 17.163 0 0l17.179 28 8.376-2.445Zm13.89 13.89L37 47.837 65 65 47.821 37l-8.376 2.445Zm-13.89 0L28 47.837 0 65l17.179-28 8.376 2.445Z"
									></path>
								</svg>
							</a>

							<h1
								data-heading
								className="mt-8 text-4xl font-medium text-foreground md:text-5xl xl:mt-4 xl:text-6xl"
							>
								<a href="https://www.epicweb.dev/stack">The Epic Stack</a>
							</h1>
							<p
								data-paragraph
								className="mt-6 text-xl/7 text-muted-foreground"
							>
								Check the{' '}
								<a
									className="underline hover:no-underline"
									href="https://github.com/epicweb-dev/epic-stack/blob/main/docs/getting-started.md"
								>
									Getting Started guide
								</a>{' '}
								file for how to get your project off the ground!
							</p>
						</div>
					</div>

					<LogoGrid />
				</div>
			</div>

			{/* <div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
						<div className="absolute inset-0">
							<img className="h-full w-full object-cover" src={stars} alt="" />
							<div className="absolute inset-0 bg-[color:rgba(30,23,38,0.5)] mix-blend-multiply" />
						</div>
						<div className="lg:pt-18 relative px-4 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20">
							<h1 className="text-center text-mega font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
								<a
									className="block uppercase text-white drop-shadow-md"
									href="https://www.epicweb.dev/stack"
								>
									<span>Epic Stack</span>
									<svg
										className="mx-auto mt-2"
										xmlns="http://www.w3.org/2000/svg"
										width="120"
										height="120"
										fill="none"
										viewBox="0 0 65 65"
									>
										<path
											fill="currentColor"
											d="M39.445 25.555 37 17.163 65 0 47.821 28l-8.376-2.445Zm-13.89 0L28 17.163 0 0l17.179 28 8.376-2.445Zm13.89 13.89L37 47.837 65 65 47.821 37l-8.376 2.445Zm-13.89 0L28 47.837 0 65l17.179-28 8.376 2.445Z"
										></path>
									</svg>
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
								guide file for how to get your project off the ground!
							</p>
						</div>

						<LogoGrid />
					</div>
				</div>

				<div className="mx-auto mt-8 max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
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
				</div>
			</div> */}
		</main>
	)
}

// Logo grid
type Logo = (typeof logos)[number]

const columnClasses: Record<Logo['column'], string> = {
	1: 'xl:col-start-1',
	2: 'xl:col-start-2',
	3: 'xl:col-start-3',
	4: 'xl:col-start-4',
	5: 'xl:col-start-5',
}

const rowClasses: Record<Logo['row'], string> = {
	1: 'xl:row-start-1',
	2: 'xl:row-start-2',
	3: 'xl:row-start-3',
	4: 'xl:row-start-4',
	5: 'xl:row-start-5',
	6: 'xl:row-start-6',
}

function LogoGrid() {
	return (
		<ul className="mt-16 flex max-w-3xl flex-wrap justify-center gap-2 sm:gap-4 xl:mt-0 xl:grid xl:grid-flow-col xl:grid-cols-5 xl:grid-rows-6">
			<TooltipProvider>
				{logos.map((logo, i) => (
					<motion.li
						key={logo.href}
						className={cn(columnClasses[logo.column], rowClasses[logo.row])}
						initial={{ opacity: 0, x: -20, scale: 0.2, rotate: 12 }}
						animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
						transition={{
							ease: 'easeOut',
							delay: i * 0.07 + 0.2,
						}}
					>
						<Tooltip>
							<TooltipTrigger asChild>
								<a
									href={logo.href}
									className="size-20 sm:size-24 grid place-items-center rounded-2xl bg-violet-100 p-4 transition hover:-rotate-6 hover:bg-violet-200"
								>
									<img src={logo.src} alt="" className="w-16" />
								</a>
							</TooltipTrigger>
							<TooltipContent>{logo.alt}</TooltipContent>
						</Tooltip>
					</motion.li>
				))}
			</TooltipProvider>
		</ul>
	)
}
