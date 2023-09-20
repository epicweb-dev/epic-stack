import { generateRobotsTxt } from '@nasa-gcn/remix-seo'
import { type DataFunctionArgs } from '@remix-run/node'

export function loader({ request }: DataFunctionArgs) {
	const origin = new URL(request.url).origin
	return generateRobotsTxt([
		{ type: 'sitemap', value: `${origin}/sitemap.xml` },
	])
}
