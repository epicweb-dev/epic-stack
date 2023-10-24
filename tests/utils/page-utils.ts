import { type Page } from '@playwright/test'
import { type RoleType } from '#tests/playwright-utils.ts'

export const goTo = async (page: Page, url: string) => {
	await page.goto(url)
}

export const clickLink = async (page: Page, name: string) => {
	await page.getByRole('link', { name: new RegExp(name, 'i') }).click()
}

export const clickButton = async (page: Page, name: string) => {
	await page.getByRole('button', { name: new RegExp(name, 'i') }).click()
}

interface FieldProps {
	role: RoleType
	name: string
	value: string
}

interface FillFormSubmitProps {
	page: Page
	fields: FieldProps[]
	submit?: boolean
}

export const fillSubmitForm = async ({
	page,
	fields,
	submit,
}: FillFormSubmitProps) => {
	for (const field of fields) {
		await page
			.getByRole(field.role, { name: new RegExp(field.name, 'i') })
			.fill(field.value)
	}
	if (submit) {
		await page.getByRole('button', { name: /submit/i }).click()
	}
}
