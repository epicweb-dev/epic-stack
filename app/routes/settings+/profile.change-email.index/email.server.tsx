import { Container, Html, Link, Tailwind, Text } from '@react-email/components'
import tailwindConfig from '../../../../tailwind.config.ts'

export function EmailChangeEmail({
	verifyUrl,
	otp,
}: {
	verifyUrl: string
	otp: string
}) {
	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container>
					<h1>
						<Text>Epic Notes Email Change</Text>
					</h1>
					<p>
						<Text>
							Here's your verification code: <strong>{otp}</strong>
						</Text>
					</p>
					<p>
						<Text>Or click the link:</Text>
					</p>
					<Link href={verifyUrl}>{verifyUrl}</Link>
				</Container>
			</Html>
		</Tailwind>
	)
}

export function EmailChangeNoticeEmail({ userId }: { userId: string }) {
	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container>
					<h1>
						<Text>Your Epic Notes email has been changed</Text>
					</h1>
					<p>
						<Text>
							We're writing to let you know that your Epic Notes email has been
							changed.
						</Text>
					</p>
					<p>
						<Text>
							If you changed your email address, then you can safely ignore
							this. But if you did not change your email address, then please
							contact support immediately.
						</Text>
					</p>
					<p>
						<Text className="text-sm text-gray-700">
							Your Account ID: {userId}
						</Text>
					</p>
				</Container>
			</Html>
		</Tailwind>
	)
}
