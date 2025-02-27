module.exports = async (...args) => {
	const { default: main } = await import('./index.mjs')
	await main(...args).catch((err) => {
		console.error('Oh no! Something went wrong initializing your epic app:')
		console.error(err)
		process.exit(1)
	})
}
