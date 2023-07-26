import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
	type DataFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useFetcher,
	useLoaderData,
} from '@remix-run/react'
import { useState } from 'react'
import { ServerOnly } from 'remix-utils'
import { z } from 'zod'
import { ErrorList } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import * as deleteImageRoute from '~/routes/resources+/delete-image.tsx'
import { authenticator, requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { getUserImgSrc, useDoubleCheck, useIsSubmitting } from '~/utils/misc.ts'

export const handle = {
	breadcrumb: <Icon name="avatar">Photo</Icon>,
}

const MAX_SIZE = 1024 * 1024 * 3 // 3MB

const PhotoFormSchema = z.object({
	photoFile: z
		.instanceof(File)
		.refine(file => file.name !== '' && file.size !== 0, 'Image is required')
		.refine(file => {
			return file.size <= MAX_SIZE
		}, 'Image size must be less than 3MB'),
})

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { imageId: true, name: true, username: true },
	})
	if (!user) {
		throw await authenticator.logout(request, { redirectTo: '/' })
	}
	return json({ user })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await unstable_parseMultipartFormData(
		request,
		unstable_createMemoryUploadHandler({ maxPartSize: MAX_SIZE }),
	)

	const submission = parse(formData, { schema: PhotoFormSchema })

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { photoFile } = submission.value

	const newPrismaPhoto = {
		contentType: photoFile.type,
		file: {
			create: {
				blob: Buffer.from(await photoFile.arrayBuffer()),
			},
		},
	}

	const previousUserPhoto = await prisma.user.findUnique({
		where: { id: userId },
		select: { imageId: true },
	})

	await prisma.user.update({
		select: { id: true },
		where: { id: userId },
		data: {
			image: {
				upsert: {
					update: newPrismaPhoto,
					create: newPrismaPhoto,
				},
			},
		},
	})

	if (previousUserPhoto?.imageId) {
		void prisma.image
			.delete({
				where: { fileId: previousUserPhoto.imageId },
			})
			.catch(() => {}) // ignore the error, maybe it never existed?
	}

	return redirect('/settings/profile')
}

export default function PhotoRoute() {
	const data = useLoaderData<typeof loader>() || {}

	const doubleCheckDeleteImage = useDoubleCheck()

	const deleteImageFetcher = useFetcher<typeof deleteImageRoute.action>()
	const actionData = useActionData<typeof action>()

	const [form, { photoFile }] = useForm({
		id: 'profile-photo',
		constraint: getFieldsetConstraint(PhotoFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: PhotoFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const isSubmitting = useIsSubmitting()

	const [newImageSrc, setNewImageSrc] = useState<string | null>(null)

	const deleteProfilePhotoFormId = 'delete-profile-photo'
	return (
		<div>
			<Form
				method="POST"
				encType="multipart/form-data"
				className="flex flex-col items-center justify-center gap-10"
				onReset={() => setNewImageSrc(null)}
				{...form.props}
			>
				<img
					src={
						newImageSrc ?? (data.user ? getUserImgSrc(data.user?.imageId) : '')
					}
					className="h-52 w-52 rounded-full object-cover"
					alt={data.user?.name ?? data.user?.username}
				/>
				<ErrorList errors={photoFile.errors} id={photoFile.id} />
				<input
					{...conform.input(photoFile, { type: 'file' })}
					accept="image/*"
					className="peer sr-only"
					tabIndex={newImageSrc ? -1 : 0}
					onChange={e => {
						const file = e.currentTarget.files?.[0]
						if (file) {
							const reader = new FileReader()
							reader.onload = event => {
								setNewImageSrc(event.target?.result?.toString() ?? null)
							}
							reader.readAsDataURL(file)
						}
					}}
				/>
				{newImageSrc ? (
					<div className="flex gap-4">
						<StatusButton
							type="submit"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
						>
							Save Photo
						</StatusButton>
						<Button type="reset" variant="secondary">
							Reset
						</Button>
					</div>
				) : (
					<div className="flex gap-4 peer-invalid:[&>.server-only[type='submit']]:hidden">
						<Button asChild className="cursor-pointer">
							<label htmlFor={photoFile.id}>
								<Icon name="pencil-1">Change</Icon>
							</label>
						</Button>

						{/* This is here for progressive enhancement. If the client doesn't
						hydrate (or hasn't yet) this button will be available to submit the
						selected photo. */}
						<ServerOnly>
							{() => (
								<Button type="submit" className="server-only">
									Save Photo
								</Button>
							)}
						</ServerOnly>
						{data.user?.imageId ? (
							<Button
								variant="destructive"
								{...doubleCheckDeleteImage.getButtonProps({
									type: 'submit',
									form: deleteProfilePhotoFormId,
								})}
							>
								<Icon name="trash">
									{doubleCheckDeleteImage.doubleCheck
										? 'Are you sure?'
										: 'Delete'}
								</Icon>
							</Button>
						) : null}
					</div>
				)}
				<ErrorList errors={form.errors} />
			</Form>
			<deleteImageFetcher.Form
				method="POST"
				id={deleteProfilePhotoFormId}
				action={deleteImageRoute.ROUTE_PATH}
				onSubmit={() => setNewImageSrc(null)}
			>
				<ServerOnly>
					{() => (
						<input
							name="redirectTo"
							value="/settings/profile/photo"
							type="hidden"
						/>
					)}
				</ServerOnly>
				<input name="intent" type="hidden" value="submit" />
				<input name="imageId" type="hidden" value={data.user?.imageId ?? ''} />
			</deleteImageFetcher.Form>
		</div>
	)
}
