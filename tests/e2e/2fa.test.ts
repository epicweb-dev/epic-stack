import { generateTOTP } from '@epic-web/totp'
import { faker } from '@faker-js/faker'
import { expect, test } from '#tests/playwright-utils.ts'

test('Users can add 2FA to their account and use it when logging in', async ({
	page,
	login,
}) => {
	const password = faker.internet.password()
	const user = await login({ password })
	await page.goto('/settings/profile')

	await page.getByRole('link', { name: /enable 2fa/i }).click()

	await expect(page).toHaveURL(`/settings/profile/two-factor`)
	const main = page.getByRole('main')
	await main.getByRole('button', { name: /enable 2fa/i }).click()
	const otpUriString = await main
		.getByLabel(/One-Time Password URI/i)
		.innerText()

	const otpUri = new URL(otpUriString)
	const options = Object.fromEntries(otpUri.searchParams)

	await main
		.getByRole('textbox', { name: /code/i })
		.fill(generateTOTP(options).otp)
	await main.getByRole('button', { name: /submit/i }).click()

	await expect(main).toHaveText(/You have enabled two-factor authentication./i)
	await expect(main.getByRole('link', { name: /disable 2fa/i })).toBeVisible()

	await page.getByRole('link', { name: user.name ?? user.username }).click()
	await page.getByRole('button', { name: /logout/i }).click()
	await expect(page).toHaveURL(`/`)

	await page.goto('/login')
	await expect(page).toHaveURL(`/login`)
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByLabel(/^password$/i).fill(password)
	await page.getByRole('button', { name: /log in/i }).click()

	await page
		.getByRole('textbox', { name: /code/i })
		.fill(generateTOTP(options).otp)

	await page.getByRole('button', { name: /submit/i }).click()

	await expect(
		page.getByRole('link', { name: user.name ?? user.username }),
	).toBeVisible()
})
