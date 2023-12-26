import { type MetaFunction } from '@remix-run/node'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { cn } from '#app/utils/misc.tsx'
import { logos } from './logos/logos.ts'

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

// Tailwind Grid cell classes lookup
const columnClasses: Record<(typeof logos)[number]['column'], string> = {
	1: 'xl:col-start-1',
	2: 'xl:col-start-2',
	3: 'xl:col-start-3',
	4: 'xl:col-start-4',
	5: 'xl:col-start-5',
}
const rowClasses: Record<(typeof logos)[number]['row'], string> = {
	1: 'xl:row-start-1',
	2: 'xl:row-start-2',
	3: 'xl:row-start-3',
	4: 'xl:row-start-4',
	5: 'xl:row-start-5',
	6: 'xl:row-start-6',
}

export default function Index() {
	return (
		<main className="relative h-full sm:flex sm:items-center sm:justify-center">
			<div className="font-poppins grid place-items-center">
				<div className="grid place-items-center px-4 py-16 xl:grid-cols-2 xl:gap-24">
					<div className="xl:order-2">
						<div className="flex max-w-md flex-col items-center text-center [--framer-translate-x:0] [--framer-translate-y:20px] xl:items-start xl:text-left xl:[--framer-translate-x:20px] xl:[--framer-translate-y:0]">
							<a
								href="https://www.epicweb.dev/stack"
								className="animate-slide-top xl:animate-slide-left [animation-fill-mode:backwards] xl:[animation-delay:0.5s] xl:[animation-fill-mode:backwards]"
							>
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
								className="animate-slide-top xl:animate-slide-left mt-8 text-4xl font-medium text-foreground [animation-fill-mode:backwards] [animation-delay:0.3s] md:text-5xl xl:mt-4 xl:text-6xl xl:[animation-fill-mode:backwards] xl:[animation-delay:0.8s]"
							>
								<a href="https://www.epicweb.dev/stack">The Epic Stack</a>
							</h1>
							<p
								data-paragraph
								className="animate-slide-top xl:animate-slide-left mt-6 text-xl/7 text-muted-foreground [animation-fill-mode:backwards] [animation-delay:0.8s] xl:mt-8 xl:text-xl/6 xl:leading-10 xl:[animation-fill-mode:backwards] xl:[animation-delay:1s]"
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
					<ul className="mt-16 flex max-w-3xl flex-wrap justify-center gap-2 sm:gap-4 xl:mt-0 xl:grid xl:grid-flow-col xl:grid-cols-5 xl:grid-rows-6">
						<TooltipProvider>
							{logos.map((logo, i) => (
								<li
									key={logo.href}
									className={cn(
										columnClasses[logo.column],
										rowClasses[logo.row],
										'animate-roll-reveal [animation-fill-mode:backwards]',
									)}
									style={{ animationDelay: `${i * 0.07}s` }}
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
								</li>
							))}
						</TooltipProvider>
					</ul>
				</div>
			</div>
		</main>
	)
}
