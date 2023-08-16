import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { getPasswordHash, requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { PasswordSchema } from '#app/utils/user-validation.ts'

export const handle = {
	breadcrumb: <Icon name="dots-horizontal">Password</Icon>,
}

const CreatePasswordForm = z
	.object({
		newPassword: PasswordSchema,
		confirmNewPassword: PasswordSchema,
	})
	.superRefine(({ confirmNewPassword, newPassword }, ctx) => {
		if (confirmNewPassword !== newPassword) {
			ctx.addIssue({
				path: ['confirmNewPassword'],
				code: 'custom',
				message: 'The passwords must match',
			})
		}
	})

async function requireNoPassword(userId: string) {
	const password = await prisma.password.findUnique({
		select: { userId: true },
		where: { userId },
	})
	if (password) {
		throw redirect('/settings/profile/password')
	}
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	await requireNoPassword(userId)
	return json({})
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	await requireNoPassword(userId)
	const formData = await request.formData()
	const submission = await parse(formData, {
		async: true,
		schema: CreatePasswordForm,
	})
	// clear the payload so we don't send the password back to the client
	submission.payload = {}
	if (submission.intent !== 'submit') {
		// clear the value so we don't send the password back to the client
		submission.value = undefined
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { newPassword } = submission.value

	await prisma.user.update({
		select: { username: true },
		where: { id: userId },
		data: {
			password: {
				create: {
					hash: await getPasswordHash(newPassword),
				},
			},
		},
	})

	return redirect(`/settings/profile`, { status: 302 })
}

export default function CreatePasswordRoute() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(CreatePasswordForm),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: CreatePasswordForm })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Form method="POST" {...form.props} className="mx-auto max-w-md">
			<Field
				labelProps={{ children: 'New Password' }}
				inputProps={conform.input(fields.newPassword, { type: 'password' })}
				errors={fields.newPassword.errors}
			/>
			<Field
				labelProps={{ children: 'Confirm New Password' }}
				inputProps={conform.input(fields.confirmNewPassword, {
					type: 'password',
				})}
				errors={fields.confirmNewPassword.errors}
			/>
			<ErrorList id={form.errorId} errors={form.errors} />
			<div className="grid w-full grid-cols-2 gap-6">
				<Button variant="secondary" asChild>
					<Link to="..">Cancel</Link>
				</Button>
				<StatusButton
					type="submit"
					status={isPending ? 'pending' : actionData?.status ?? 'idle'}
				>
					Create Password
				</StatusButton>
			</div>
		</Form>
	)
}
