import { Link } from '@remix-run/react'
import { Button } from '#app/components/index.ts'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser, useUser } from '#app/utils/user.ts'
import DropdownNavigation from '../templates/dropdown-navigation.tsx'

function NavUserControls() {
	const user = useOptionalUser()

	function UserDropdown() {
		const user = useUser()

		return (
			<DropdownNavigation
				menuItems={[
					{
						label: 'Profile',
						to: `/users/${user.username}`,
						iconName: 'avatar',
					},
					{
						label: 'Notes',
						to: `/users/${user.username}/notes`,
						iconName: 'pencil-2',
					},
				]}
				button={{
					to: `/users/${user.username}`,
					alt: user.name ?? user.username,
					imgSrc: getUserImgSrc(user.image?.id),
					label: user.name ?? user.username,
				}}
				logout
			/>
		)
	}

	return (
		<div className="flex items-center gap-10">
			{user ? (
				<UserDropdown />
			) : (
				<Button asChild variant="default" size="sm">
					<Link to="/login">Log In</Link>
				</Button>
			)}
		</div>
	)
}

export { NavUserControls }
