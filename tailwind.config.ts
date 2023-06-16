import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme.js'
import tailwindcssRadix from 'tailwindcss-radix'

export default {
	content: ['./app/**/*.{ts,tsx,jsx,js}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				background: 'rgb(var(--color-background))',
				foreground: 'rgb(var(--color-foreground))',
				primary: 'rgb(var(--color-primary))',
				secondary: 'rgb(var(--color-secondary))',
				success: {
					title: 'rgb(var(--color-success-title))',
					DEFAULT: 'rgb(var(--color-success-foreground))',
					background: 'rgb(var(--color-success-background))',
				},
				info: {
					title: 'rgb(var(--color-info-title))',
					DEFAULT: 'rgb(var(--color-info-foreground))',
					background: 'rgb(var(--color-info-background))',
				},
				warning: {
					title: 'rgb(var(--color-warning-title))',
					DEFAULT: 'rgb(var(--color-warning-foreground))',
					background: 'rgb(var(--color-warning-background))',
				},
				danger: {
					title: 'rgb(var(--color-danger-title))',
					DEFAULT: 'rgb(var(--color-danger-foreground))',
					background: 'rgb(var(--color-danger-background))',
				},
				'muted-50': 'var(--color-muted-50)',
				'muted-100': 'var(--color-muted-100)',
				'muted-200': 'var(--color-muted-200)',
				'muted-300': 'var(--color-muted-300)',
				'muted-400': 'var(--color-muted-400)',
				'muted-500': 'var(--color-muted-500)',
				'muted-600': 'var(--color-muted-600)',
				'muted-700': 'var(--color-muted-700)',
				'muted-800': 'var(--color-muted-800)',
				'muted-900': 'var(--color-muted-900)',
				'muted-950': 'var(--color-muted-950)',
				ring: 'rgb(var(--ring))',
			},
			fontFamily: {
				sans: [
					'Nunito Sans',
					'Nunito Sans Fallback',
					...defaultTheme.fontFamily.sans,
				],
			},
			fontSize: {
				// 1rem = 16px
				/** 80px size / 84px high / bold */
				mega: ['5rem', { lineHeight: '5.25rem', fontWeight: '700' }],
				/** 56px size / 62px high / bold */
				h1: ['3.5rem', { lineHeight: '3.875rem', fontWeight: '700' }],
				/** 40px size / 48px high / bold */
				h2: ['2.5rem', { lineHeight: '3rem', fontWeight: '700' }],
				/** 32px size / 36px high / bold */
				h3: ['2rem', { lineHeight: '2.25rem', fontWeight: '700' }],
				/** 28px size / 36px high / bold */
				h4: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
				/** 24px size / 32px high / bold */
				h5: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
				/** 16px size / 20px high / bold */
				h6: ['1rem', { lineHeight: '1.25rem', fontWeight: '700' }],

				/** 32px size / 36px high / normal */
				'body-2xl': ['2rem', { lineHeight: '2.25rem' }],
				/** 28px size / 36px high / normal */
				'body-xl': ['1.75rem', { lineHeight: '2.25rem' }],
				/** 24px size / 32px high / normal */
				'body-lg': ['1.5rem', { lineHeight: '2rem' }],
				/** 20px size / 28px high / normal */
				'body-md': ['1.25rem', { lineHeight: '1.75rem' }],
				/** 16px size / 20px high / normal */
				'body-sm': ['1rem', { lineHeight: '1.25rem' }],
				/** 14px size / 18px high / normal */
				'body-xs': ['0.875rem', { lineHeight: '1.125rem' }],
				/** 12px size / 16px high / normal */
				'body-2xs': ['0.75rem', { lineHeight: '1rem' }],

				/** 18px size / 24px high / semibold */
				caption: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
				/** 12px size / 16px high / bold */
				button: ['0.75rem', { lineHeight: '1rem', fontWeight: '700' }],
			},
		},
	},
	plugins: [tailwindcssRadix],
} satisfies Config
