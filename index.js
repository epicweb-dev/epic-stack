import 'varlock/auto-load'
import * as fs from 'node:fs'
import sourceMapSupport from 'source-map-support'
import { ENV } from 'varlock/env'

sourceMapSupport.install({
	retrieveSourceMap: function (source) {
		// get source file without the `file://` prefix or `?t=...` suffix
		const match = source.match(/^file:\/\/(.*)\?t=[.\d]+$/)
		if (match) {
			return {
				url: source,
				map: fs.readFileSync(`${match[1]}.map`, 'utf8'),
			}
		}
		return null
	},
})

if (ENV.MOCKS) {
	await import('./tests/mocks/index.ts')
}

if (ENV.MODE === 'production') {
	await import('./server-build/index.js')
} else {
	await import('./server/index.ts')
}
