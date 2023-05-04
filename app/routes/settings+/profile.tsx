import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	Link,
	Outlet,
	useActionData,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { z } from 'zod'
import {
	authenticator,
	getPasswordHash,
	requireUserId,
	verifyLogin,
} from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import {
	Button,
	Field,
	getFieldsFromSchema,
	preprocessFormData,
	useForm,
} from '~/utils/forms'
import { getUserImgSrc } from '~/utils/misc'
import {
	emailSchema,
	nameSchema,
	passwordSchema,
	usernameSchema,
} from '~/utils/user-validation'

const ProfileFormSchema = z
	.object({
		name: nameSchema.optional(),
		username: usernameSchema,
		email: emailSchema.optional(),
		phone: z.string().optional(),
		address: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		zip: z.string().optional(),
		country: z.string().optional(),
		hostBio: z.string().optional(),
		renterBio: z.string().optional(),
		currentPassword: z
			.union([passwordSchema, z.string().min(0).max(0)])
			.optional(),
		newPassword: z.union([passwordSchema, z.string().min(0).max(0)]).optional(),
	})
	.superRefine(async ({ username, currentPassword, newPassword }, ctx) => {
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
	if (!user) {
		throw await authenticator.logout(request, { redirectTo: '/' })
	}
	return json({ user, fieldMetadatas: getFieldsFromSchema(ProfileFormSchema) })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const result = await ProfileFormSchema.safeParseAsync(
		preprocessFormData(formData, ProfileFormSchema),
	)

	if (!result.success) {
		return json({ status: 'error', errors: result.error.flatten() } as const, {
			status: 400,
		})
	}

	const { name, username, email, newPassword } = result.data

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

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	const { form, fields } = useForm({
		name: 'edit-profile',
		errors: actionData?.status === 'error' ? actionData.errors : null,
		fieldMetadatas: data.fieldMetadatas,
	})

	return (
		<div className="container m-auto mb-36 mt-16 max-w-3xl">
			<div className="flex gap-3">
				<Link className="text-night-300" to={`/users/${data.user.username}`}>
					Profile
				</Link>
				<span className="text-night-300">▶️</span>
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
						<Link
							to="photo"
							className="absolute -right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border-4 border-night-700 bg-night-500 p-5"
							title="Change profile photo"
							aria-label="Change profile photo"
						>
							📷
						</Link>
					</div>
				</div>
				<Form method="POST" {...form.props}>
					<div className="grid grid-cols-6 gap-x-10">
						<Field
							className="col-span-3"
							labelProps={{
								...fields.username.labelProps,
								children: 'Username',
							}}
							inputProps={{
								...fields.username.props,
								defaultValue: data.user.username,
							}}
							errors={fields.username.errors}
						/>
						<Field
							className="col-span-3"
							labelProps={{ ...fields.name.labelProps, children: 'Name' }}
							inputProps={{
								...fields.name.props,
								defaultValue: data.user.name ?? '',
							}}
							errors={fields.name.errors}
						/>
						<Field
							className="col-span-3"
							labelProps={{ ...fields.email.labelProps, children: 'Email' }}
							inputProps={{
								...fields.email.props,
								defaultValue: data.user.email ?? '',
								// TODO: support changing your email address
								disabled: true,
							}}
							errors={fields.email.errors}
						/>

						<div className="col-span-6 mb-12 mt-6 h-1 border-b-[1.5px] border-night-500" />
						<fieldset className="col-span-6">
							<legend className="pb-6 text-lg text-night-200">
								Change password
							</legend>
							<div className="flex justify-between gap-10">
								<Field
									className="flex-1"
									labelProps={{
										...fields.currentPassword.labelProps,
										children: 'Current Password',
									}}
									inputProps={{
										...fields.currentPassword.props,
										type: 'password',
										autoComplete: 'current-password',
									}}
									errors={fields.currentPassword.errors}
								/>
								<Field
									className="flex-1"
									labelProps={{
										...fields.newPassword.labelProps,
										children: 'New Password',
									}}
									inputProps={{
										...fields.newPassword.props,
										type: 'password',
										autoComplete: 'new-password',
									}}
									errors={fields.newPassword.errors}
								/>
							</div>
						</fieldset>
					</div>

					{form.errorUI}

					<div className="mt-3 flex justify-center">
						<Button
							type="submit"
							size="md-wide"
							variant="primary"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
						>
							Save changes
						</Button>
					</div>
				</Form>
			</div>
			<Outlet />
		</div>
	)
}
