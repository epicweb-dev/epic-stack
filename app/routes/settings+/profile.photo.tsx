import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import * as Dialog from '@radix-ui/react-dialog'
import {
	type DataFunctionArgs,
	json,
	redirect,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useFetcher,
	useLoaderData,
	useNavigate,
} from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import * as deleteImageRoute from '~/routes/resources+/delete-image.tsx'
import { authenticator, requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { Button, ErrorList, LabelButton } from '~/utils/forms.tsx'
import { getUserImgSrc } from '~/utils/misc.ts'

const MAX_SIZE = 1024 * 1024 * 3 // 3MB

/*
The preprocess call is needed because a current bug in @remix-run/web-fetch
for more info see the bug (https://github.com/remix-run/web-std-io/pull/28)
and the explanation here: https://conform.guide/file-upload
*/
const PhotoFormSchema = z.object({
	photoFile: z.preprocess(
		value => (value === '' ? new File([], '') : value),
		z
			.instanceof(File)
			.refine(file => file.name !== '' && file.size !== 0, 'Image is required')
			.refine(file => {
				return file.size <= MAX_SIZE
			}, 'Image size must be less than 3MB'),
	),
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
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
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

export default function PhotoChooserModal() {
	const data = useLoaderData<typeof loader>()
	const [newImageSrc, setNewImageSrc] = useState<string | null>(null)
	const navigate = useNavigate()
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

	const deleteProfilePhotoFormId = 'delete-profile-photo'
	const dismissModal = () => navigate('..', { preventScrollReset: true })
	return (
		<Dialog.Root open={true}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 backdrop-blur-[2px]" />
				<Dialog.Content
					onEscapeKeyDown={dismissModal}
					onPointerDownOutside={dismissModal}
					className="fixed left-1/2 top-1/2 w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-night-500 p-12 shadow-lg"
				>
					<Dialog.Title asChild className="text-center">
						<h2 className="text-h2">Profile photo</h2>
					</Dialog.Title>
					<Form
						method="POST"
						encType="multipart/form-data"
						className="mt-8 flex flex-col items-center justify-center gap-10"
						onReset={() => setNewImageSrc(null)}
						{...form.props}
					>
						<img
							src={newImageSrc ?? getUserImgSrc(data.user.imageId)}
							className="h-64 w-64 rounded-full"
							alt={data.user.name ?? data.user.username}
						/>
						<ErrorList errors={photoFile.errors} id={photoFile.id} />
						<input
							{...conform.input(photoFile, { type: 'file' })}
							type="file"
							accept="image/*"
							className="sr-only"
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
								<Button type="submit" size="md" variant="primary">
									Save Photo
								</Button>
								<Button type="reset" size="md" variant="secondary">
									Reset
								</Button>
							</div>
						) : (
							<div className="flex gap-4">
								<LabelButton htmlFor={photoFile.id} size="md" variant="primary">
									✏️ Change
								</LabelButton>
								{data.user.imageId ? (
									<Button
										size="md"
										variant="secondary"
										type="submit"
										form={deleteProfilePhotoFormId}
									>
										🗑 Delete
									</Button>
								) : null}
							</div>
						)}
						<ErrorList errors={form.errors} />
					</Form>
					<Dialog.Close asChild>
						<Link
							to=".."
							preventScrollReset
							aria-label="Close"
							className="absolute right-10 top-10"
						>
							❌
						</Link>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
			<deleteImageFetcher.Form
				method="POST"
				id={deleteProfilePhotoFormId}
				action={deleteImageRoute.ROUTE_PATH}
			>
				<input name="intent" type="hidden" value="submit" />
				<input name="imageId" type="hidden" value={data.user.imageId ?? ''} />
			</deleteImageFetcher.Form>
		</Dialog.Root>
	)
}
