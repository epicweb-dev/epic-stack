import {
	Header,
	Nav,
	NavLogo,
	NavSearch,
	NavUserControls,
} from '#app/components/layout/index.ts'

function PageHeader() {
	return (
		<Header className="container py-6">
			<Nav variant="marketing">
				<div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
					<NavLogo />
					<NavSearch variant="desktop" />
					<NavUserControls />
					<NavSearch variant="mobile" />
				</div>
			</Nav>
		</Header>
	)
}

export { PageHeader }
