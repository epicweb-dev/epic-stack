import * as Checkbox from '@radix-ui/react-checkbox'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type DataFunctionArgs,
	type LinksFunction,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Form,
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetcher,
	useLoaderData,
	useSubmit,
} from '@remix-run/react'
import { clsx } from 'clsx'
import { useState } from 'react'
import tailwindStylesheetUrl from './styles/tailwind.css'
import { authenticator, getUserId } from './utils/auth.server.ts'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { ButtonLink } from './utils/forms.tsx'
import { getUserImgSrc } from './utils/misc.ts'
import { useUser } from './utils/user.ts'

export const links: LinksFunction = () => {
	return [
		{
			rel: 'apple-touch-icon',
			sizes: '180x180',
			href: '/favicons/apple-touch-icon.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '32x32',
			href: '/favicons/favicon-32x32.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '16x16',
			href: '/favicons/favicon-16x16.png',
		},
		{ rel: 'manifest', href: '/site.webmanifest' },
		{ rel: 'icon', href: '/favicon.ico' },
		{ rel: 'stylesheet', href: '/fonts/nunito-sans/font.css' },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export const meta: V2_MetaFunction = () => {
	return [
		{ title: 'Epic Notes' },
		{ name: 'description', content: 'Find yourself in outer space' },
	]
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await getUserId(request)

	const user = userId
		? await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true, name: true, username: true, imageId: true },
		  })
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await authenticator.logout(request, { redirectTo: '/' })
	}

	return json({ user, ENV: getEnv() })
}

export default function App() {
	const data = useLoaderData<typeof loader>()
	const { user } = data
	return (
		<html lang="en" className="dark h-full">
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="flex h-full flex-col justify-between bg-night-700 text-white">
				<header className="container mx-auto py-6">
					<nav className="flex justify-between">
						<Link to="/">
							<div className="font-light">epic</div>
							<div className="font-bold">notes</div>
						</Link>
						<div className="flex items-center gap-10">
							{user ? (
								<UserDropdown />
							) : (
								<ButtonLink to="/login" size="sm" variant="primary">
									Log In
								</ButtonLink>
							)}
						</div>
					</nav>
				</header>

				<div className="flex-1">
					<Outlet />
				</div>

				<div className="container mx-auto flex justify-between">
					<Link to="/">
						<div className="font-light">epic</div>
						<div className="font-bold">notes</div>
					</Link>
					<ThemeSwitch />
				</div>
				<div className="h-5" />
				<ScrollRestoration />
				<Scripts />
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(data.ENV)}`,
					}}
				/>
				<LiveReload />
			</body>
		</html>
	)
}

function ThemeSwitch() {
	const fetcher = useFetcher()
	const [mode, setMode] = useState<'system' | 'dark' | 'light'>('system')
	const checked: boolean | 'indeterminate' =
		mode === 'system' ? 'indeterminate' : mode === 'dark'
	const theme = mode === 'system' ? 'dark' : mode
	return (
		<fetcher.Form>
			<label>
				<Checkbox.Root
					className={clsx('bg-gray-night-500 h-10 w-20 rounded-full p-1', {
						'bg-night-500': theme === 'dark',
						'bg-white': theme === 'light',
					})}
					checked={checked}
					name="theme"
					value={mode}
					onCheckedChange={() =>
						setMode(oldMode =>
							oldMode === 'system'
								? 'light'
								: oldMode === 'light'
								? 'dark'
								: 'system',
						)
					}
					aria-label={
						mode === 'system'
							? 'System Theme'
							: mode === 'dark'
							? 'Dark Theme'
							: 'Light Theme'
					}
				>
					<span
						className={clsx('flex justify-between rounded-full', {
							'bg-white': mode === 'system' && theme === 'dark',
							'theme-switch-light': mode === 'system' && theme === 'light',
						})}
					>
						<span
							className={clsx(
								'theme-switch-light',
								'flex h-8 w-8 items-center justify-center rounded-full',
								{
									'text-white': mode === 'light',
								},
							)}
						>
							🔆
						</span>
						<span
							className={clsx(
								'theme-switch-dark',
								'flex h-8 w-8 items-center justify-center rounded-full',
								{
									'text-white': mode === 'dark',
								},
							)}
						>
							🌙
						</span>
					</span>
				</Checkbox.Root>
			</label>
		</fetcher.Form>
	)
}

function UserDropdown() {
	const user = useUser()
	const submit = useSubmit()
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<Link
					to={`/users/${user.username}`}
					// this is for progressive enhancement
					onClick={e => e.preventDefault()}
					className="flex items-center gap-2 rounded-full bg-night-500 py-2 pl-2 pr-4 outline-none hover:bg-night-400 focus:bg-night-400 radix-state-open:bg-night-400"
				>
					<img
						className="h-8 w-8 rounded-full object-cover"
						alt={user.name ?? user.username}
						src={getUserImgSrc(user.imageId)}
					/>
					<span className="text-body-sm font-bold">
						{user.name ?? user.username}
					</span>
				</Link>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					sideOffset={8}
					align="start"
					className="flex flex-col rounded-3xl bg-[#323232]"
				>
					<DropdownMenu.Item asChild>
						<Link
							prefetch="intent"
							to={`/users/${user.username}`}
							className="rounded-t-3xl px-7 py-5 outline-none hover:bg-night-500 radix-highlighted:bg-night-500"
						>
							Profile
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item asChild>
						<Link
							prefetch="intent"
							to={`/users/${user.username}/notes`}
							className="px-7 py-5 outline-none hover:bg-night-500 radix-highlighted:bg-night-500"
						>
							Notes
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item asChild>
						<Form
							action="/logout"
							method="POST"
							className="rounded-b-3xl px-7 py-5 outline-none radix-highlighted:bg-night-500"
							onClick={e => submit(e.currentTarget)}
						>
							<button type="submit">Logout</button>
						</Form>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
