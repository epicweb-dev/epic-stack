import { expect, test } from '#tests/playwright-utils.ts'

test('files in public/img and public/favicons are served', async ({
	request,
}) => {
	for (const path of [
		'/img/user.png',
		'/favicons/android-chrome-192x192.png',
	]) {
		const response = await request.get(path)
		expect(response.status(), `${path} should be served`).toBe(200)
	}
})

test('missing files in /img and /favicons return 404', async ({ request }) => {
	for (const path of ['/img/missing.png', '/favicons/missing.png']) {
		const response = await request.get(path)
		expect(response.status(), `${path} should 404`).toBe(404)
	}
})
