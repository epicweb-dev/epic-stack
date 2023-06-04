import { execa } from 'execa'

if (process.env.NODE_ENV === 'production') {
	await import('./index.js')
} else {
	const command =
		'tsx watch --clear-screen=false --ignore "app/**" --ignore "build/**" --ignore "node_modules/**" ./index.js'
	execa(command, {
		stdio: ['ignore', 'inherit', 'inherit'],
		env: {
			...process.env,
			FORCE_COLOR: true,
		},
		// https://github.com/sindresorhus/execa/issues/433
		windowsHide: false,
	})
}
