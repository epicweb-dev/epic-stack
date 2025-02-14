import { faker } from '@faker-js/faker'
import { type CDPSession } from '@playwright/test'
import { expect, test } from '#tests/playwright-utils.ts'

async function setupWebAuthn(page: any) {
	const client = await page.context().newCDPSession(page)
	// https://chromedevtools.github.io/devtools-protocol/tot/WebAuthn/
	await client.send('WebAuthn.enable', { options: { enableUI: true } })
	const result = await client.send('WebAuthn.addVirtualAuthenticator', {
		options: {
			protocol: 'ctap2',
			transport: 'internal',
			hasUserVerification: true,
			isUserVerified: true,
		},
	})
	return { client, authenticatorId: result.authenticatorId }
}

async function simulateSuccessfulPasskeyInput(
	client: CDPSession,
	authenticatorId: string,
	operationTrigger: () => Promise<void>,
) {
	// initialize event listeners to wait for a successful passkey input event
	const operationCompleted = new Promise<void>((resolve) => {
		client.on('WebAuthn.credentialAdded', () => resolve())
		client.on('WebAuthn.credentialAsserted', () => resolve())
	})

	// perform a user action that triggers passkey prompt
	await operationTrigger()

	// wait to receive the event that the passkey was successfully registered or verified
	await operationCompleted
}

test('Users can register and use passkeys', async ({ page, login }) => {
	const password = faker.internet.password()
	const user = await login({ password })

	const { client, authenticatorId } = await setupWebAuthn(page)

	const initialCredentials = await client.send('WebAuthn.getCredentials', {
		authenticatorId,
	})
	expect(
		initialCredentials.credentials,
		'No credentials should exist initially',
	).toHaveLength(0)

	await page.goto('/settings/profile/passkeys')

	await simulateSuccessfulPasskeyInput(client, authenticatorId, async () => {
		await page.getByRole('button', { name: /register new passkey/i }).click()
	})

	// Verify the passkey appears in the UI
	await expect(page.getByRole('list', { name: /passkeys/i })).toBeVisible()
	await expect(page.getByText(/registered .* ago/i)).toBeVisible()

	const afterRegistrationCredentials = await client.send(
		'WebAuthn.getCredentials',
		{ authenticatorId },
	)
	expect(
		afterRegistrationCredentials.credentials,
		'One credential should exist after registration',
	).toHaveLength(1)

	// Logout
	await page.getByRole('link', { name: user.name ?? user.username }).click()
	await page.getByRole('menuitem', { name: /logout/i }).click()
	await expect(page).toHaveURL(`/`)

	// Try logging in with passkey
	await page.goto('/login')
	const signCount1 = afterRegistrationCredentials.credentials[0].signCount

	await simulateSuccessfulPasskeyInput(client, authenticatorId, async () => {
		await page.getByRole('button', { name: /login with a passkey/i }).click()
	})

	// Verify successful login
	await expect(
		page.getByRole('link', { name: user.name ?? user.username }),
	).toBeVisible()

	// Verify the sign count increased
	const afterLoginCredentials = await client.send('WebAuthn.getCredentials', {
		authenticatorId,
	})
	expect(afterLoginCredentials.credentials).toHaveLength(1)
	expect(afterLoginCredentials.credentials[0].signCount).toBeGreaterThan(
		signCount1,
	)

	// Go to passkeys page and delete the passkey
	await page.goto('/settings/profile/passkeys')
	await page.getByRole('button', { name: /delete/i }).click()

	// Verify the passkey is no longer listed on the page
	await expect(page.getByText(/no passkeys registered/i)).toBeVisible()

	// But verify it still exists in the authenticator
	const afterDeletionCredentials = await client.send(
		'WebAuthn.getCredentials',
		{ authenticatorId },
	)
	expect(afterDeletionCredentials.credentials).toHaveLength(1)

	// Logout again to test deleted passkey
	await page.getByRole('link', { name: user.name ?? user.username }).click()
	await page.getByRole('menuitem', { name: /logout/i }).click()
	await expect(page).toHaveURL(`/`)

	// Try logging in with the deleted passkey
	await page.goto('/login')
	await simulateSuccessfulPasskeyInput(client, authenticatorId, async () => {
		await page.getByRole('button', { name: /login with a passkey/i }).click()
	})

	// Verify error message appears
	await expect(page.getByText(/passkey not found/i)).toBeVisible()

	// Verify we're still on the login page
	await expect(page).toHaveURL(`/login`)
})

test('Failed passkey verification shows error', async ({ page, login }) => {
	const password = faker.internet.password()
	await login({ password })

	// Set up WebAuthn
	const { client, authenticatorId } = await setupWebAuthn(page)

	// Navigate to passkeys page
	await page.goto('/settings/profile/passkeys')

	// Try to register with failed verification
	await client.send('WebAuthn.setUserVerified', {
		authenticatorId,
		isUserVerified: false,
	})

	await client.send('WebAuthn.setAutomaticPresenceSimulation', {
		authenticatorId,
		enabled: true,
	})

	await page.getByRole('button', { name: /register new passkey/i }).click()

	// Wait for error message
	await expect(page.getByText(/failed to create passkey/i)).toBeVisible()

	// Verify no passkey was registered
	const credentials = await client.send('WebAuthn.getCredentials', {
		authenticatorId,
	})
	expect(credentials.credentials).toHaveLength(0)
})
