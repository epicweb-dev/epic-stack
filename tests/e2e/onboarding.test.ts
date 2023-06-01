import { faker } from '@faker-js/faker'
import invariant from 'tiny-invariant'
import {
	deleteUserByUsername,
	expect,
	insertNewUser,
	test,
} from '../playwright-utils.ts'
import { readEmail } from '../mocks/utils.ts'

const urlRegex = /(?<url>https?:\/\/[^\s$.?#].[^\s]*)/
function extractUrl(text: string) {
	const match = text.match(urlRegex)
	return match?.groups?.url
}

test('onboarding', async ({ page }) => {
	const firstName = faker.name.firstName()
	const lastName = faker.name.lastName()
	const username = faker.internet.userName(firstName, lastName).slice(0, 15)
	const onboardingData = {
		name: `${firstName} ${lastName}`,
		username,
		email: `${username}@example.com`,
		password: faker.internet.password(),
	}

	await page.goto('/')

	await page.getByRole('link', { name: /log in/i }).click()
	await expect(page).toHaveURL(`/login`)

	const createAccountLink = page.getByRole('link', {
		name: /create an account/i,
	})
	await createAccountLink.click()

	await expect(page).toHaveURL(`/signup`)

	const emailTextbox = page.getByRole('textbox', { name: /email/i })

	// Check for the error message
	await emailTextbox.click()
	await emailTextbox.fill('kody@kcd.dev')
	await page.getByRole('button', { name: /launch/i }).click()
	await expect(
		page.getByText(/user already exists with this email/i),
	).toBeVisible()

	// continue the test with valid email...
	await emailTextbox.click()
	await emailTextbox.fill(onboardingData.email)
	await page.getByRole('button', { name: /launch/i }).click()
	await expect(
		page.getByRole('button', { name: /launch/i, disabled: true }),
	).toBeVisible()
	await expect(page.getByText(/check your email/i)).toBeVisible()

	const email = await readEmail(onboardingData.email)
	invariant(email, 'Email not found')
	expect(email.to).toBe(onboardingData.email)
	expect(email.from).toBe('hello@epicstack.dev')
	expect(email.subject).toMatch(/welcome/i)
	const onboardingUrl = extractUrl(email.text)
	invariant(onboardingUrl, 'Onboarding URL not found')
	await page.goto(onboardingUrl)

	await expect(page).toHaveURL(`/onboarding`)
	await page
		.getByRole('textbox', { name: /^username/i })
		.fill(onboardingData.username)

	await page.getByRole('textbox', { name: /^name/i }).fill(onboardingData.name)

	await page.getByLabel(/^password/i).fill(onboardingData.password)

	await page.getByLabel(/^confirm password/i).fill(onboardingData.password)

	await page.getByLabel(/terms/i).check()

	await page.getByLabel(/offers/i).check()

	await page.getByLabel(/remember me/i).check()

	await page.getByRole('button', { name: /Create an account/i }).click()

	await expect(page).toHaveURL(`/`)

	await page.getByRole('link', { name: onboardingData.name }).click()
	await page.getByRole('menuitem', { name: /profile/i }).click()

	await expect(page).toHaveURL(`/users/${onboardingData.username}`)

	await page.getByRole('link', { name: onboardingData.name }).click()
	await page.getByRole('menuitem', { name: /logout/i }).click()
	await expect(page).toHaveURL(`/`)

	// have to do this here because we didn't use insertNewUser (because we're testing user create)
	await deleteUserByUsername(onboardingData.username)
})

test('login as existing user', async ({ page }) => {
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

test('reset password', async ({ page }) => {
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
	await expect(page.getByText(/instructions have been sent/i)).toBeVisible()

	const email = await readEmail(user.email)
	invariant(email, 'Email not found')
	expect(email.subject).toMatch(/password reset/i)
	expect(email.to).toBe(user.email)
	expect(email.from).toBe('hello@epicstack.dev')
	const resetPasswordUrl = extractUrl(email.text)
	invariant(resetPasswordUrl, 'Reset password URL not found')
	await page.goto(resetPasswordUrl)

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
