import { invariant } from '@epic-web/invariant'
import * as E from '@react-email/components'
import { data } from '@remix-run/node'
import {
	requireRecentVerification,
	type VerifyFunctionArgs,
} from '#app/routes/_auth+/verify.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { sendEmail } from '#app/utils/email.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'
import { newEmailAddressSessionKey } from './profile.change-email'

export async function handleVerification({
	request,
	submission,
}: VerifyFunctionArgs) {
	await requireRecentVerification(request)
	invariant(
		submission.status === 'success',
		'Submission should be successful by now',
	)

	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const newEmail = verifySession.get(newEmailAddressSessionKey)
	if (!newEmail) {
		return data(
			{
				result: submission.reply({
					formErrors: [
						'You must submit the code on the same device that requested the email change.',
					],
				}),
			},
			{ status: 400 },
		)
	}
	const preUpdateUser = await prisma.user.findFirstOrThrow({
		select: { email: true },
		where: { id: submission.value.target },
	})
	const user = await prisma.user.update({
		where: { id: submission.value.target },
		select: { id: true, email: true, username: true },
		data: { email: newEmail },
	})

	void sendEmail({
		to: preUpdateUser.email,
		subject: 'Epic Stack email changed',
		react: <EmailChangeNoticeEmail userId={user.id} />,
	})

	return redirectWithToast(
		'/settings/profile',
		{
			title: 'Email Changed',
			type: 'success',
			description: `Your email has been changed to ${user.email}`,
		},
		{
			headers: {
				'set-cookie': await verifySessionStorage.destroySession(verifySession),
			},
		},
	)
}

export function EmailChangeEmail({
	verifyUrl,
	otp,
}: {
	verifyUrl: string
	otp: string
}) {
	return (
		<E.Html lang="en" dir="ltr">
			<E.Container>
				<h1>
					<E.Text>Epic Notes Email Change</E.Text>
				</h1>
				<p>
					<E.Text>
						Here's your verification code: <strong>{otp}</strong>
					</E.Text>
				</p>
				<p>
					<E.Text>Or click the link:</E.Text>
				</p>
				<E.Link href={verifyUrl}>{verifyUrl}</E.Link>
			</E.Container>
		</E.Html>
	)
}

function EmailChangeNoticeEmail({ userId }: { userId: string }) {
	return (
		<E.Html lang="en" dir="ltr">
			<E.Container>
				<h1>
					<E.Text>Your Epic Notes email has been changed</E.Text>
				</h1>
				<p>
					<E.Text>
						We're writing to let you know that your Epic Notes email has been
						changed.
					</E.Text>
				</p>
				<p>
					<E.Text>
						If you changed your email address, then you can safely ignore this.
						But if you did not change your email address, then please contact
						support immediately.
					</E.Text>
				</p>
				<p>
					<E.Text>Your Account ID: {userId}</E.Text>
				</p>
			</E.Container>
		</E.Html>
	)
}
