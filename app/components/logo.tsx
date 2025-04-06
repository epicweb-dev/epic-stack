import { Link } from "react-router";

export function Logo() {
	return (
		<Link to="/" className="group grid leading-snug">
			<span className="font-light transition group-hover:-translate-x-1">
				epic
			</span>
			<span className="font-bold transition group-hover:translate-x-1">
				notes
			</span>
		</Link>
	)
}