import { Container, Html, Link, Tailwind, Text } from '@react-email/components'
import tailwindConfig from '../../../../tailwind.config.ts'

export function ForgotPasswordEmail({
	onboardingUrl,
	otp,
}: {
	onboardingUrl: string
	otp: string
}) {
	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container>
					<h1>
						<Text>Epic Notes Password Reset</Text>
					</h1>
					<p>
						<Text>
							Here's your verification code: <strong>{otp}</strong>
						</Text>
					</p>
					<p>
						<Text>Or click the link:</Text>
					</p>
					<Link href={onboardingUrl}>{onboardingUrl}</Link>
				</Container>
			</Html>
		</Tailwind>
	)
}
