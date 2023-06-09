import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { twoFAVerificationType } from '~/routes/settings+/profile.two-factor.tsx'
import { authenticator } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { Button, ErrorList, Field } from '~/utils/forms.tsx'
import { safeRedirect } from '~/utils/misc.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { verifyTOTP } from '~/utils/totp.server.ts'

const ROUTE_PATH = '/resources/verify'
export const unverifiedSessionKey = 'unverified-sessionId'

const verifySchema = z.union([
	z.object({
		intent: z.literal('cancel'),
	}),
	z.object({
		intent: z.literal('confirm'),
		code: z.string().min(6).max(6),
		redirectTo: z.string().optional(),
	}),
])

export async function action({ request }: DataFunctionArgs) {
	const form = await request.formData()

	const cookieSession = await getSession(request.headers.get('cookie'))
	const sessionId = cookieSession.get(unverifiedSessionKey)
	if (!sessionId) {
		// TODO: think about this edge case a bit more...
		throw redirect('/login')
	}
	const session = await prisma.session.findFirst({
		where: { id: sessionId },
		select: { userId: true },
	})

	// if there's no session for their session ID, something is *way* wrong.
	// destory it and let them try over again... Or we'll do that if they wanna cancel.
	if (!session || form.get('intent') === 'cancel') {
		const redirectTo = form.get('redirectTo')
		const params =
			typeof redirectTo === 'string' && redirectTo && redirectTo !== '/'
				? new URLSearchParams({ redirectTo })
				: null
		cookieSession.unset(unverifiedSessionKey)
		throw redirect(['/login', params?.toString()].filter(Boolean).join('?'), {
			headers: {
				'Set-Cookie': await commitSession(cookieSession),
			},
		})
	}

	const submission = await parse(form, {
		schema: () =>
			verifySchema.superRefine(async (data, ctx) => {
				if (data.intent === 'cancel') return

				const verification = await prisma.verification.findFirst({
					where: {
						type: twoFAVerificationType,
						target: session.userId,
					},
					select: {
						algorithm: true,
						secret: true,
						period: true,
					},
				})
				if (!verification) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return
				}
				const result = verifyTOTP({
					otp: data.code,
					secret: verification.secret,
					algorithm: verification.algorithm,
					period: verification.period,
					window: 1,
				})
				if (!result) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return
				}
			}),
		acceptMultipleErrors: () => true,
		async: true,
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

	invariant(submission.value.intent === 'confirm', 'invalid intent')

	const { redirectTo } = submission.value
	cookieSession.unset(unverifiedSessionKey)
	cookieSession.set(authenticator.sessionKey, sessionId)
	const newCookie = await commitSession(cookieSession)
	if (redirectTo) {
		throw redirect(safeRedirect(redirectTo), {
			headers: { 'Set-Cookie': newCookie },
		})
	}
	return json({ status: 'success', submission } as const, {
		headers: { 'Set-Cookie': newCookie },
	})
}

export function Verifier({
	redirectTo,
	formError,
}: {
	redirectTo?: string
	formError?: string | null
}) {
	const fetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'inline-verifier',
		constraint: getFieldsetConstraint(verifySchema),
		lastSubmission: fetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: verifySchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<fetcher.Form action={ROUTE_PATH} method="POST" {...form.props}>
			<input type="hidden" name="redirectTo" value={redirectTo} />
			<Field
				labelProps={{ children: '2FA Code' }}
				inputProps={{ ...conform.input(fields.code), autoFocus: true }}
				errors={fields.code.errors}
			/>
			<div className="flex flex-row-reverse justify-between">
				<Button
					type="submit"
					variant="primary"
					size="md"
					name="intent"
					value="confirm"
					status={
						fetcher.state === 'submitting'
							? 'pending'
							: fetcher.data?.status ?? 'idle'
					}
				>
					Confirm
				</Button>
				<Button
					type="submit"
					variant="secondary"
					size="md"
					name="intent"
					value="cancel"
					status={
						fetcher.state === 'submitting'
							? 'pending'
							: fetcher.data?.status ?? 'idle'
					}
				>
					Cancel
				</Button>
			</div>
			<ErrorList errors={[...form.errors, formError]} id={form.errorId} />
		</fetcher.Form>
	)
}
