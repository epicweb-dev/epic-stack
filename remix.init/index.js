module.exports = async (...args) => {
	const { default: main } = await import('./index.mjs')
	await main(...args)
}
