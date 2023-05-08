export async function sendEmail(email: {
	to: string
	subject: string
	html: string
	text: string
}) {
	if (!process.env.MAILGUN_SENDING_KEY && !process.env.MOCKS) {
		console.error(`MAILGUN_SENDING_KEY not set and we're not in mocks mode.`)
		console.error(
			`To send emails, set MAILGUN_SENDING_KEY and MAILGUN_DOMAIN environment variables.`,
		)
		console.error(`Failing to send the following email:`, JSON.stringify(email))
		return
	}
	const auth = `${Buffer.from(
		`api:${process.env.MAILGUN_SENDING_KEY}`,
	).toString('base64')}`

	const body = new URLSearchParams({
		...email,
		from: 'hello@epicstack.dev',
	})

	return fetch(
		`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
		{
			method: 'POST',
			body,
			headers: {
				Authorization: `Basic ${auth}`,
			},
		},
	)
}
