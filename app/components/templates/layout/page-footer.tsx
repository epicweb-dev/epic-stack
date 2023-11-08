import {
	Footer,
	NavLogo,
	ThemeSwitch,
	type ThemeSwitchProps,
} from '#app/components/index.ts'

function PageFooter({ userPreference }: ThemeSwitchProps) {
	return (
		<Footer>
			<NavLogo />
			<ThemeSwitch userPreference={userPreference} />
		</Footer>
	)
}

export { PageFooter }
