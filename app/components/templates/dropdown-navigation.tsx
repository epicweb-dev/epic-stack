import { Link, useSubmit, Form } from '@remix-run/react'
import React, { useRef } from 'react'
import { Button } from '#app/components/index.ts'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
} from '#app/components/ui/dropdown-menu.tsx'
import { Icon, type IconName } from '../ui/icon.tsx'

interface DropdownNavigationMenuItem {
	label: string
	to: string
	iconName: IconName
}

interface DropdownNavigationProps {
	menuItems: DropdownNavigationMenuItem[]
	button: {
		to: string
		alt: string
		imgSrc: string
		label: string
	}
	logout: boolean
}

export default function DropdownNavigation({
	menuItems,
	button,
	logout,
}: DropdownNavigationProps) {
	const submit = useSubmit()
	const formRef = useRef<HTMLFormElement>(null)

	const DropdownButton = () => {
		const { to, alt, imgSrc, label } = button

		return (
			<Button asChild variant="secondary">
				<Link
					to={to}
					onClick={e => e.preventDefault()}
					className="flex items-center gap-2"
				>
					<img
						className="h-8 w-8 rounded-full object-cover"
						alt={alt}
						src={imgSrc}
					/>
					<span className="text-body-sm font-bold">{label}</span>
				</Link>
			</Button>
		)
	}

	const DropdownItems = () => {
		return (
			<>
				{menuItems.map((item, index) => {
					const { label, to, iconName } = item
					return (
						<DropdownMenuItem key={index} asChild>
							<Link prefetch="intent" to={to}>
								<Icon className="text-body-md" name={iconName}>
									{label}
								</Icon>
							</Link>
						</DropdownMenuItem>
					)
				})}
			</>
		)
	}

	const Logout = () => {
		if (logout) {
			return (
				<DropdownMenuItem
					asChild
					onSelect={event => {
						event.preventDefault()
						submit(formRef.current)
					}}
				>
					<Form action="/logout" method="POST" ref={formRef}>
						<Icon className="text-body-md" name="exit">
							<button type="submit">Logout</button>
						</Icon>
					</Form>
				</DropdownMenuItem>
			)
		}
		return null
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{DropdownButton()}</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="start">
					{DropdownItems()}
					{Logout()}
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}
