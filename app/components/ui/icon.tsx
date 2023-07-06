// THIS FILE IS GENERATED, edit ./other/svg-icon-template.txt instead
// then run "npm run gen-svg-sprite"

import { type SVGProps } from 'react'
import { cn } from '~/utils/misc.ts'
import href from './icon.svg'
export { href }

const sizeClassName = {
	font: 'w-[1em] h-[1em]',
	xs: 'w-3 h-3',
	sm: 'w-4 h-4',
	md: 'w-5 h-5',
	lg: 'w-6 h-6',
	xl: 'w-7 h-7',
} as const

type Size = keyof typeof sizeClassName

const childrenSizeClassName = {
	font: 'gap-1',
	xs: 'gap-1',
	sm: 'gap-1',
	md: 'gap-2',
	lg: 'gap-2',
	xl: 'gap-3',
} satisfies Record<Size, string>

/**
 * Renders an SVG icon. The icon defaults to the size of the font. To make it
 * align vertically with neighboring text, you need to wrap the icon and text
 * in a common parent and set the parent to display "flex" (or "inline-flex").
 * Alternatively, if you're ok with the icon being to the left of the text,
 * you can pass the text as a child of the icon and it will be automatically
 * aligned.
 */
export function Icon({
	name,
	size = 'font',
	className,
	children,
	...props
}: SVGProps<SVGSVGElement> & {
	name: IconName
	size?: Size
}) {
	if (children) {
		return (
			<span className={`inline-flex ${childrenSizeClassName[size]}`}>
				<Icon name={name} size={size} className={className} {...props} />
				{children}
			</span>
		)
	}
	return (
		<svg
			{...props}
			className={cn(sizeClassName[size], 'inline self-center', className)}
		>
			<use href={`${href}#${name}`} />
		</svg>
	)
}

type IconName =
	| 'avatar'
	| 'camera'
	| 'check'
	| 'clock'
	| 'cross-1'
	| 'exit'
	| 'laptop'
	| 'lock-closed'
	| 'lock-open-1'
	| 'moon'
	| 'pencil-1'
	| 'pencil-2'
	| 'plus'
	| 'reset'
	| 'sun'
	| 'trash'
