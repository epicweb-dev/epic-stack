import { expect, test as setup } from '@playwright/test'

setup('partial passkey signup', async ({ page }) => {
	const client = await page.context().newCDPSession(page)
	await client.send('WebAuthn.enable')
	const { authenticatorId } = await client.send(
		'WebAuthn.addVirtualAuthenticator',
		{
			options: {
				protocol: 'ctap2',
				transport: 'usb',
				hasResidentKey: true,
				hasUserVerification: true,
				isUserVerified: true,
				automaticPresenceSimulation: true,
			},
		},
	)

	await page.goto('https://webauthn.io/')
	await page.getByPlaceholder('example_username').click()
	await page.getByPlaceholder('example_username').fill('test_user')
	await page.getByRole('button', { name: 'Register' }).click()

	await expect(page.getByText('Success!')).toBeVisible()

	const passkey = await client.send('WebAuthn.getCredentials', {
		authenticatorId,
	})

	expect(passkey.credentials).toHaveLength(1)

	let asserted = new Promise<void>((resolve) => {
		client.once('WebAuthn.credentialAsserted', () => resolve())
	})

	await page.getByRole('button', { name: 'Authenticate' }).click()

	await asserted

	await expect(page.getByText("You're logged in!")).toBeVisible()
})
