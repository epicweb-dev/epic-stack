import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useFormAction,
	useLoaderData,
	useLocation,
	useNavigation,
} from '@remix-run/react'
import { z } from 'zod'
import {
	authenticator,
	getPasswordHash,
	requireUserId,
	verifyLogin,
} from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ErrorList, Field } from '~/components/forms.tsx'
import { getUserImgSrc, AnimatedOutlet } from '~/utils/misc.ts'
import {
	emailSchema,
	nameSchema,
	passwordSchema,
	usernameSchema,
} from '~/utils/user-validation.ts'
import { twoFAVerificationType } from './profile.two-factor.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { useRef } from 'react'
import { CSSTransition, SwitchTransition } from 'react-transition-group'

const profileFormSchema = z.object({
	name: nameSchema.optional(),
	username: usernameSchema,
	email: emailSchema.optional(),
	currentPassword: z
		.union([passwordSchema, z.string().min(0).max(0)])
		.optional(),
	newPassword: z.union([passwordSchema, z.string().min(0).max(0)]).optional(),
})

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			email: true,
			imageId: true,
		},
	})
	const twoFactorVerification = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: userId },
		select: { id: true },
	})
	if (!user) {
		throw await authenticator.logout(request, { redirectTo: '/' })
	}
	return json({ user, isTwoFactorEnabled: Boolean(twoFactorVerification) })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = await parse(formData, {
		async: true,
		schema: profileFormSchema.superRefine(
			async ({ username, currentPassword, newPassword }, ctx) => {
				if (newPassword && !currentPassword) {
					ctx.addIssue({
						path: ['newPassword'],
						code: 'custom',
						message: 'Must provide current password to change password.',
					})
				}
				if (currentPassword && newPassword) {
					const user = await verifyLogin(username, currentPassword)
					if (!user) {
						ctx.addIssue({
							path: ['currentPassword'],
							code: 'custom',
							message: 'Incorrect password.',
						})
					}
				}
			},
		),
		acceptMultipleErrors: () => true,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	const { name, username, email, newPassword } = submission.value

	if (email) {
		// TODO: send a confirmation email
	}

	const updatedUser = await prisma.user.update({
		select: { id: true, username: true },
		where: { id: userId },
		data: {
			name,
			username,
			password: newPassword
				? {
						update: {
							hash: await getPasswordHash(newPassword),
						},
				  }
				: undefined,
		},
	})

	return redirect(`/users/${updatedUser.username}`, { status: 302 })
}

export default function EditUserProfile() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()

	const location = useLocation()
	const nodeRef = useRef(null)

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	const [form, fields] = useForm({
		id: 'edit-profile',
		constraint: getFieldsetConstraint(profileFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: profileFormSchema })
		},
		defaultValue: {
			username: data.user.username,
			name: data.user.name ?? '',
			email: data.user.email,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container m-auto mb-36 mt-16 max-w-3xl">
			<div className="flex gap-3">
				<Link
					className="text-muted-foreground"
					to={`/users/${data.user.username}`}
				>
					Profile
				</Link>
				<span className="text-muted-foreground">▶️</span>
				<span>Edit Profile</span>
			</div>
			<div className="mt-16 flex flex-col gap-12">
				<div className="flex justify-center">
					<div className="relative h-52 w-52">
						<img
							src={getUserImgSrc(data.user.imageId)}
							alt={data.user.username}
							className="h-full w-full rounded-full object-cover"
						/>
						<Button
							asChild
							variant="outline"
							className="absolute -right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full p-0"
						>
							<Link
								preventScrollReset
								to="photo"
								title="Change profile photo"
								aria-label="Change profile photo"
							>
								<Icon name="camera" className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
				<Form method="POST" {...form.props}>
					<div className="grid grid-cols-6 gap-x-10">
						<Field
							className="col-span-3"
							labelProps={{
								htmlFor: fields.username.id,
								children: 'Username',
							}}
							inputProps={conform.input(fields.username)}
							errors={fields.username.errors}
						/>
						<Field
							className="col-span-3"
							labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
							inputProps={conform.input(fields.name)}
							errors={fields.name.errors}
						/>
						<Field
							className="col-span-3"
							labelProps={{ htmlFor: fields.email.id, children: 'Email' }}
							inputProps={{
								...conform.input(fields.email),
								// TODO: support changing your email address
								disabled: true,
							}}
							errors={fields.email.errors}
						/>

						<div className="col-span-6 mb-12 mt-6 h-1 border-b-[1.5px]" />
						<fieldset className="col-span-6">
							<legend className="pb-6 text-lg">Change password</legend>
							<div className="flex justify-between gap-10">
								<Field
									className="flex-1"
									labelProps={{
										htmlFor: fields.currentPassword.id,
										children: 'Current Password',
									}}
									inputProps={{
										...conform.input(fields.currentPassword, {
											type: 'password',
										}),
										autoComplete: 'current-password',
									}}
									errors={fields.currentPassword.errors}
								/>
								<Field
									className="flex-1"
									labelProps={{
										htmlFor: fields.newPassword.id,
										children: 'New Password',
									}}
									inputProps={{
										...conform.input(fields.newPassword, { type: 'password' }),
										autoComplete: 'new-password',
									}}
									errors={fields.newPassword.errors}
								/>
							</div>
						</fieldset>
						<Link
							preventScrollReset
							to="two-factor"
							className="col-span-full flex gap-1"
						>
							{data.isTwoFactorEnabled ? (
								<>
									<Icon name="lock-closed" /> 2FA is enabled
								</>
							) : (
								<>
									<Icon name="lock-open-1" /> Enable 2FA
								</>
							)}
						</Link>
					</div>

					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="mt-8 flex justify-center">
						<StatusButton
							type="submit"
							size="wide"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
						>
							Save changes
						</StatusButton>
					</div>
				</Form>
			</div>
			<SwitchTransition>
				<CSSTransition key={location.pathname} timeout={150} nodeRef={nodeRef}>
					<div ref={nodeRef}>
						<AnimatedOutlet />
					</div>
				</CSSTransition>
			</SwitchTransition>
		</div>
	)
}
