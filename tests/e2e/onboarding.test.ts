import { invariant } from '@epic-web/invariant'
import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import {
	MOCK_CODE_GITHUB,
	MOCK_CODE_GITHUB_HEADER,
} from '#app/utils/providers/constants'
import {
	normalizeEmail,
	normalizeUsername,
} from '#app/utils/providers/provider'
import { deleteGitHubUser, insertGitHubUser } from '#tests/mocks/github'
import { readEmail } from '#tests/mocks/utils.ts'
import { createUser, expect, test as base } from '#tests/playwright-utils.ts'

const URL_REGEX = /(?<url>https?:\/\/[^\s$.?#].[^\s]*)/
const CODE_REGEX = /Here's your verification code: (?<code>[\d\w]+)/
function extractUrl(text: string) {
	const match = text.match(URL_REGEX)
	return match?.groups?.url
}

const test = base.extend<{
	getOnboardingData(): {
		username: string
		name: string
		email: string
		password: string
	}
}>({
	getOnboardingData: async ({}, use) => {
		const userData = createUser()
		await use(() => {
			const onboardingData = {
				...userData,
				password: faker.internet.password(),
			}
			return onboardingData
		})
		await prisma.user.deleteMany({ where: { username: userData.username } })
	},
})

test('onboarding with link', async ({ page, getOnboardingData }) => {
	const onboardingData = getOnboardingData()

	await page.goto('/')

	await page.getByRole('link', { name: /log in/i }).click()
	await expect(page).toHaveURL(`/login`)

	const createAccountLink = page.getByRole('link', {
		name: /create an account/i,
	})
	await createAccountLink.click()

	await expect(page).toHaveURL(`/signup`)

	const emailTextbox = page.getByRole('textbox', { name: /email/i })
	await emailTextbox.click()
	await emailTextbox.fill(onboardingData.email)

	await page.getByRole('button', { name: /submit/i }).click()
	await expect(
		page.getByRole('button', { name: /submit/i, disabled: true }),
	).toBeVisible()
	await expect(page.getByText(/check your email/i)).toBeVisible()

	const email = await readEmail(onboardingData.email)
	invariant(email, 'Email not found')
	expect(email.to).toBe(onboardingData.email.toLowerCase())
	expect(email.from).toBe('hello@epicstack.dev')
	expect(email.subject).toMatch(/welcome/i)
	const onboardingUrl = extractUrl(email.text)
	invariant(onboardingUrl, 'Onboarding URL not found')
	await page.goto(onboardingUrl)

	await expect(page).toHaveURL(/\/verify/)

	await page
		.getByRole('main')
		.getByRole('button', { name: /submit/i })
		.click()

	await expect(page).toHaveURL(`/onboarding`)
	await page
		.getByRole('textbox', { name: /^username/i })
		.fill(onboardingData.username)

	await page.getByRole('textbox', { name: /^name/i }).fill(onboardingData.name)

	await page.getByLabel(/^password/i).fill(onboardingData.password)

	await page.getByLabel(/^confirm password/i).fill(onboardingData.password)

	await page.getByLabel(/terms/i).check()

	await page.getByLabel(/remember me/i).check()

	await page.getByRole('button', { name: /Create an account/i }).click()

	await expect(page).toHaveURL(`/`)

	await page.getByRole('link', { name: onboardingData.name }).click()
	await page.getByRole('menuitem', { name: /profile/i }).click()

	await expect(page).toHaveURL(`/users/${onboardingData.username}`)

	await page.getByRole('link', { name: onboardingData.name }).click()
	await page.getByRole('menuitem', { name: /logout/i }).click()
	await expect(page).toHaveURL(`/`)
})

test('onboarding with a short code', async ({ page, getOnboardingData }) => {
	const onboardingData = getOnboardingData()

	await page.goto('/signup')

	const emailTextbox = page.getByRole('textbox', { name: /email/i })
	await emailTextbox.click()
	await emailTextbox.fill(onboardingData.email)

	await page.getByRole('button', { name: /submit/i }).click()
	await expect(
		page.getByRole('button', { name: /submit/i, disabled: true }),
	).toBeVisible()
	await expect(page.getByText(/check your email/i)).toBeVisible()

	const email = await readEmail(onboardingData.email)
	invariant(email, 'Email not found')
	expect(email.to).toBe(onboardingData.email.toLowerCase())
	expect(email.from).toBe('hello@epicstack.dev')
	expect(email.subject).toMatch(/welcome/i)
	const codeMatch = email.text.match(CODE_REGEX)
	const code = codeMatch?.groups?.code
	invariant(code, 'Onboarding code not found')
	await page.getByRole('textbox', { name: /code/i }).fill(code)
	await page.getByRole('button', { name: /submit/i }).click()

	await expect(page).toHaveURL(`/onboarding`)
})

test('onboarding with GitHub OAuth', async ({ page }) => {
	const code = `${MOCK_CODE_GITHUB}_${crypto.randomUUID()}_PLAYWRIGHT_TEST`

	await page.route(/\/auth\/github(?!\/callback)/, async (route, request) => {
		const headers = { ...request.headers(), [MOCK_CODE_GITHUB_HEADER]: code }
		await route.continue({ headers })
	})

	const ghUser = await insertGitHubUser(code)!

	// let's verify we do not have user with that email in our system:
	expect(
		await prisma.user.findUnique({
			where: { email: normalizeEmail(ghUser.primaryEmail) },
		}),
	).toBeNull()

	await page.goto('/signup')
	await page.getByRole('button', { name: /signup with github/i }).click()

	await expect(page).toHaveURL(/\/onboarding\/github/)
	expect(
		page.getByText(new RegExp(`welcome aboard ${ghUser.primaryEmail}`, 'i')),
	).toBeVisible()

	// fields are pre-populated for the user
	const usernameInput = page.getByRole('textbox', { name: /username/i })
	expect(usernameInput).toHaveValue(
		// @ts-ignore
		normalizeUsername(ghUser.profile.login),
	)
	expect(page.getByRole('textbox', { name: /^name/i })).toHaveValue(
		ghUser.profile.name,
	)

	// button currently in 'idle' (neutral) state and so has got no companion
	const createAccountButton = page.getByRole('button', {
		name: /create an account/i,
	})
	expect(createAccountButton.getByRole('status')).not.toBeVisible()
	expect(createAccountButton.getByText('cross')).not.toBeAttached()

	// attempt 1
	// Username is a string of alphanums and underscores from 3 to 20 chars
	// long, that will be lowercased upon sumbission. See: app/utils/user-validation.ts:
	await usernameInput.fill('U$er_name') // $ is invalid char
	await createAccountButton.click()

	await expect(createAccountButton.getByRole('status')).toBeVisible()
	expect(createAccountButton.getByText('cross')).toBeAttached()
	await expect(
		page.getByText(
			/username can only include letters, numbers, and underscores/i,
		),
	).toBeVisible()
	// but we also never checked that privacy consent box
	await expect(
		page.getByText(
			/you must agree to the terms of service and privacy policy/i,
		),
	).toBeVisible()
	await expect(page).toHaveURL(/\/onboarding\/github/)

	// attempt 2
	await usernameInput.fill('')
	await createAccountButton.click()
	await expect(page.getByText(/username is required/i)).toBeVisible()
	await expect(page).toHaveURL(/\/onboarding\/github/)

	// attempt 3
	await usernameInput.fill(`U5er_name_0k_${faker.person.lastName()}`)
	await createAccountButton.click()
	await expect(
		page.getByText(/must agree to the terms of service and privacy policy/i),
	).toBeVisible()
	await expect(page).toHaveURL(/\/onboarding\/github/)

	// attempt 4 (we forgot about the checkbox)
	await page
		.getByLabel(/do you agree to our terms of service and privacy policy/i)
		.check()
	await createAccountButton.click()
	await expect(page).toHaveURL(/signup/i) // home page

	// we are still on the 'signup' route since that
	// was the referrer and no 'redirectTo' has been specified
	await expect(page).toHaveURL('/signup')
	await expect(page.getByText(/thanks for signing up/i)).toBeVisible()

	// internally, a user is being created:
	const newlyCreatedUser = await prisma.user.findUniqueOrThrow({
		where: { email: normalizeEmail(ghUser.primaryEmail) },
	})

	// log out
	await page
		.getByRole('link', { name: newlyCreatedUser.name as string })
		.click()
	await page.getByRole('menuitem', { name: /logout/i }).click()
	await expect(page).toHaveURL(`/`)

	// delete newly created connection, but keep the user:
	const newlyCreatedConn = await prisma.connection.findFirst({
		where: { providerName: 'github', userId: newlyCreatedUser.id },
	})
	await prisma.connection.delete({ where: { id: newlyCreatedConn!.id } })

	// now, try to sign up with GitHub once again:
	await page.goto('/signup')
	await page.getByRole('button', { name: /signup with github/i }).click()

	// the user was already registered in out system, so we only create a new
	// entry in 'connection' table, making a new session and redirecting them to home page:
	await expect(page).toHaveURL('/')
	expect(
		// we also notify them with a toast
		page.getByText(
			new RegExp(
				`your "${ghUser!.profile.login}" github account has been connected`,
				'i',
			),
		),
	).toBeVisible()

	// clean up
	await prisma.user.delete({ where: { username: newlyCreatedUser.username } })
	await prisma.session.deleteMany({ where: { userId: newlyCreatedUser.id } })
	await deleteGitHubUser(ghUser.primaryEmail)
})

test('login as existing user', async ({ page, insertNewUser }) => {
	const password = faker.internet.password()
	const user = await insertNewUser({ password })
	invariant(user.name, 'User name not found')
	await page.goto('/login')
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByLabel(/^password$/i).fill(password)
	await page.getByRole('button', { name: /log in/i }).click()
	await expect(page).toHaveURL(`/`)

	await expect(page.getByRole('link', { name: user.name })).toBeVisible()
})

test('reset password with a link', async ({ page, insertNewUser }) => {
	const originalPassword = faker.internet.password()
	const user = await insertNewUser({ password: originalPassword })
	invariant(user.name, 'User name not found')
	await page.goto('/login')

	await page.getByRole('link', { name: /forgot password/i }).click()
	await expect(page).toHaveURL('/forgot-password')

	await expect(
		page.getByRole('heading', { name: /forgot password/i }),
	).toBeVisible()
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByRole('button', { name: /recover password/i }).click()
	await expect(
		page.getByRole('button', { name: /recover password/i, disabled: true }),
	).toBeVisible()
	await expect(page.getByText(/check your email/i)).toBeVisible()

	const email = await readEmail(user.email)
	invariant(email, 'Email not found')
	expect(email.subject).toMatch(/password reset/i)
	expect(email.to).toBe(user.email.toLowerCase())
	expect(email.from).toBe('hello@epicstack.dev')
	const resetPasswordUrl = extractUrl(email.text)
	invariant(resetPasswordUrl, 'Reset password URL not found')
	await page.goto(resetPasswordUrl)

	await expect(page).toHaveURL(/\/verify/)

	await page
		.getByRole('main')
		.getByRole('button', { name: /submit/i })
		.click()

	await expect(page).toHaveURL(`/reset-password`)
	const newPassword = faker.internet.password()
	await page.getByLabel(/^new password$/i).fill(newPassword)
	await page.getByLabel(/^confirm password$/i).fill(newPassword)

	await page.getByRole('button', { name: /reset password/i }).click()
	await expect(
		page.getByRole('button', { name: /reset password/i, disabled: true }),
	).toBeVisible()

	await expect(page).toHaveURL('/login')
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByLabel(/^password$/i).fill(originalPassword)
	await page.getByRole('button', { name: /log in/i }).click()

	await expect(page.getByText(/invalid username or password/i)).toBeVisible()

	await page.getByLabel(/^password$/i).fill(newPassword)
	await page.getByRole('button', { name: /log in/i }).click()

	await expect(page).toHaveURL(`/`)

	await expect(page.getByRole('link', { name: user.name })).toBeVisible()
})

test('reset password with a short code', async ({ page, insertNewUser }) => {
	const user = await insertNewUser()
	await page.goto('/login')

	await page.getByRole('link', { name: /forgot password/i }).click()
	await expect(page).toHaveURL('/forgot-password')

	await expect(
		page.getByRole('heading', { name: /forgot password/i }),
	).toBeVisible()
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByRole('button', { name: /recover password/i }).click()
	await expect(
		page.getByRole('button', { name: /recover password/i, disabled: true }),
	).toBeVisible()
	await expect(page.getByText(/check your email/i)).toBeVisible()

	const email = await readEmail(user.email)
	invariant(email, 'Email not found')
	expect(email.subject).toMatch(/password reset/i)
	expect(email.to).toBe(user.email)
	expect(email.from).toBe('hello@epicstack.dev')
	const codeMatch = email.text.match(CODE_REGEX)
	const code = codeMatch?.groups?.code
	invariant(code, 'Reset Password code not found')
	await page.getByRole('textbox', { name: /code/i }).fill(code)
	await page.getByRole('button', { name: /submit/i }).click()

	await expect(page).toHaveURL(`/reset-password`)
})
