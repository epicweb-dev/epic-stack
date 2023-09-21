import { generateRobotsTxt } from '@nasa-gcn/remix-seo'
import { type DataFunctionArgs } from '@remix-run/node'
import { getDomainUrl } from '#app/utils/misc.tsx'

export function loader({ request }: DataFunctionArgs) {
	return generateRobotsTxt([
		{ type: 'sitemap', value: `${getDomainUrl(request)}/sitemap.xml` },
	])
}
