import { parse } from 'node-html-parser'
import type { Meta } from '@sly-cli/sly'

/**
 * @type {import('@sly-cli/sly/dist').Transformer}
 */
export default function transformIcon(input: string, meta: Meta) {
	input = removeDimensions(input)
	input = prependLicenseInfo(input, meta)

	return input
}

function removeDimensions(input: string) {
	const root = parse(input)
	const svg = root.querySelector('svg')
	if (!svg) throw new Error('No SVG element found')

	svg.removeAttribute('width')
	svg.removeAttribute('height')

	return root.toString()
}

function prependLicenseInfo(input: string, meta: Meta): string {
	return [
		`<!-- Downloaded from ${meta.name} -->`,
		`<!-- License ${meta.license} -->`,
		`<!-- ${meta.source} -->`,
		input,
	].join('\n')
}
