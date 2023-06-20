export async function sendEmail(email: {
	to: string
	subject: string
	html: string
	text: string
}) {
	const from = 'hello@epicstack.dev'

	// feel free to remove this condition once you've set up resend
	if (!process.env.RESEND_API_KEY && !process.env.MOCKS) {
		console.error(`RESEND_API_KEY not set and we're not in mocks mode.`)
		console.error(
			`To send emails, set the RESEND_API_KEY environment variable.`,
		)
		console.error(`Failing to send the following email:`, JSON.stringify(email))
		return new Response(null, { status: 200 })
	}

	return fetch('https://api.resend.com/emails', {
		method: 'POST',
		body: JSON.stringify({
			from,
			...email,
		}),
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
	})
}
