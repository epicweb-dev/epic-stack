import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { Img } from 'openimg/react'
import { data, Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getUserImgSrc, useDoubleCheck } from '#app/utils/misc.tsx'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { NameSchema, UsernameSchema } from '#app/utils/user-validation.ts'
import { type Route, type Info } from './+types/profile.index.ts'
import { twoFAVerificationType } from './profile.two-factor.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

const ProfileFormSchema = z.object({
	name: NameSchema.nullable().default(null),
	username: UsernameSchema,
})

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			email: true,
			image: {
				select: { objectKey: true },
			},
			_count: {
				select: {
					sessions: {
						where: {
							expirationDate: { gt: new Date() },
						},
					},
				},
			},
		},
	})

	const twoFactorVerification = await prisma.verification.findUnique({
		select: { id: true },
		where: { target_type: { type: twoFAVerificationType, target: userId } },
	})

	const password = await prisma.password.findUnique({
		select: { userId: true },
		where: { userId },
	})

	return {
		user,
		hasPassword: Boolean(password),
		isTwoFactorEnabled: Boolean(twoFactorVerification),
	}
}

type ProfileActionArgs = {
	request: Request
	userId: string
	formData: FormData
}
const profileUpdateActionIntent = 'update-profile'
const signOutOfSessionsActionIntent = 'sign-out-of-sessions'
const deleteDataActionIntent = 'delete-data'

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
		case profileUpdateActionIntent: {
			return profileUpdateAction({ request, userId, formData })
		}
		case signOutOfSessionsActionIntent: {
			return signOutOfSessionsAction({ request, userId, formData })
		}
		case deleteDataActionIntent: {
			return deleteDataAction({ request, userId, formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export default function EditUserProfile({ loaderData }: Route.ComponentProps) {
	return (
		<div className="flex flex-col gap-12">
			<div className="flex justify-center">
				<div className="relative h-52 w-52">
					<Img
						src={getUserImgSrc(loaderData.user.image?.objectKey)}
						alt={loaderData.user.username}
						className="h-full w-full rounded-full object-cover"
						width={832}
						height={832}
						isAboveFold
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
			<UpdateProfile loaderData={loaderData} />

			<div className="col-span-6 my-6 h-1 border-b-[1.5px] border-foreground" />
			<div className="col-span-full flex flex-col gap-6">
				<div>
					<Link to="change-email">
						<Icon name="envelope-closed">
							Change email from {loaderData.user.email}
						</Icon>
					</Link>
				</div>
				<div>
					<Link to="two-factor">
						{loaderData.isTwoFactorEnabled ? (
							<Icon name="lock-closed">2FA is enabled</Icon>
						) : (
							<Icon name="lock-open-1">Enable 2FA</Icon>
						)}
					</Link>
				</div>
				<div>
					<Link to={loaderData.hasPassword ? 'password' : 'password/create'}>
						<Icon name="dots-horizontal">
							{loaderData.hasPassword ? 'Change Password' : 'Create a Password'}
						</Icon>
					</Link>
				</div>
				<div>
					<Link to="connections">
						<Icon name="link-2">Manage connections</Icon>
					</Link>
				</div>
				<div>
					<Link to="passkeys">
						<Icon name="passkey">Manage passkeys</Icon>
					</Link>
				</div>
				<div>
					<Link
						reloadDocument
						download="my-epic-notes-data.json"
						to="/resources/download-user-data"
					>
						<Icon name="download">Download your data</Icon>
					</Link>
				</div>
				<SignOutOfSessions loaderData={loaderData} />
				<DeleteData />
			</div>
		</div>
	)
}

async function profileUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: ProfileFormSchema.superRefine(async ({ username }, ctx) => {
			const existingUsername = await prisma.user.findUnique({
				where: { username },
				select: { id: true },
			})
			if (existingUsername && existingUsername.id !== userId) {
				ctx.addIssue({
					path: ['username'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this username',
				})
			}
		}),
	})
	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { username, name } = submission.value

	await prisma.user.update({
		select: { username: true },
		where: { id: userId },
		data: {
			name: name,
			username: username,
		},
	})

	return {
		result: submission.reply(),
	}
}

function UpdateProfile({ loaderData }: { loaderData: Info['loaderData'] }) {
	const fetcher = useFetcher<typeof profileUpdateAction>()

	const [form, fields] = useForm({
		id: 'edit-profile',
		constraint: getZodConstraint(ProfileFormSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ProfileFormSchema })
		},
		defaultValue: {
			username: loaderData.user.username,
			name: loaderData.user.name,
		},
	})

	return (
		<fetcher.Form method="POST" {...getFormProps(form)}>
			<div className="grid grid-cols-6 gap-x-10">
				<Field
					className="col-span-3"
					labelProps={{
						htmlFor: fields.username.id,
						children: 'Username',
					}}
					inputProps={getInputProps(fields.username, { type: 'text' })}
					errors={fields.username.errors}
				/>
				<Field
					className="col-span-3"
					labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
					inputProps={getInputProps(fields.name, { type: 'text' })}
					errors={fields.name.errors}
				/>
			</div>

			<ErrorList errors={form.errors} id={form.errorId} />

			<div className="mt-8 flex justify-center">
				<StatusButton
					type="submit"
					size="wide"
					name="intent"
					value={profileUpdateActionIntent}
					status={
						fetcher.state !== 'idle' ? 'pending' : (form.status ?? 'idle')
					}
				>
					Save changes
				</StatusButton>
			</div>
		</fetcher.Form>
	)
}

async function signOutOfSessionsAction({ request, userId }: ProfileActionArgs) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)
	invariantResponse(
		sessionId,
		'You must be authenticated to sign out of other sessions',
	)
	await prisma.session.deleteMany({
		where: {
			userId,
			id: { not: sessionId },
		},
	})
	return { status: 'success' } as const
}

function SignOutOfSessions({
	loaderData: loaderData,
}: {
	loaderData: Info['loaderData']
}) {
	const dc = useDoubleCheck()

	const fetcher = useFetcher<typeof signOutOfSessionsAction>()
	const otherSessionsCount = loaderData.user._count.sessions - 1
	return (
		<div>
			{otherSessionsCount ? (
				<fetcher.Form method="POST">
					<StatusButton
						{...dc.getButtonProps({
							type: 'submit',
							name: 'intent',
							value: signOutOfSessionsActionIntent,
						})}
						variant={dc.doubleCheck ? 'destructive' : 'default'}
						status={
							fetcher.state !== 'idle'
								? 'pending'
								: (fetcher.data?.status ?? 'idle')
						}
					>
						<Icon name="avatar">
							{dc.doubleCheck
								? `Are you sure?`
								: `Sign out of ${otherSessionsCount} other sessions`}
						</Icon>
					</StatusButton>
				</fetcher.Form>
			) : (
				<Icon name="avatar">This is your only session</Icon>
			)}
		</div>
	)
}

async function deleteDataAction({ userId }: ProfileActionArgs) {
	await prisma.user.delete({ where: { id: userId } })
	return redirectWithToast('/', {
		type: 'success',
		title: 'Data Deleted',
		description: 'All of your data has been deleted',
	})
}

function DeleteData() {
	const dc = useDoubleCheck()

	const fetcher = useFetcher<typeof deleteDataAction>()
	return (
		<div>
			<fetcher.Form method="POST">
				<StatusButton
					{...dc.getButtonProps({
						type: 'submit',
						name: 'intent',
						value: deleteDataActionIntent,
					})}
					variant={dc.doubleCheck ? 'destructive' : 'default'}
					status={fetcher.state !== 'idle' ? 'pending' : 'idle'}
				>
					<Icon name="trash">
						{dc.doubleCheck ? `Are you sure?` : `Delete all your data`}
					</Icon>
				</StatusButton>
			</fetcher.Form>
		</div>
	)
}
