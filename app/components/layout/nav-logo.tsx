import { Link } from '@remix-run/react'

function NavLogo() {
	return (
		<Link to="/">
			<div className="font-light">🦄 epic</div>
			<div className="font-bold">🥞 pat stack</div>
		</Link>
	)
}

export { NavLogo }
