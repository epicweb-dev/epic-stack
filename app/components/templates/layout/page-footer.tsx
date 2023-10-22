import { Footer, NavLogo } from '#app/components/layout/index.ts'
import { ThemeSwitch, type ThemeSwitchProps } from '../theme-switch.tsx'

function PageFooter({ userPreference }: ThemeSwitchProps) {
	return (
		<Footer>
			<NavLogo />
			<ThemeSwitch userPreference={userPreference} />
		</Footer>
	)
}

export { PageFooter }
