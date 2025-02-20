import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { invariantResponse } from '@epic-web/invariant'
import { lookup as getMimeType } from 'mime-types'
import { http, HttpResponse } from 'msw'

// Ensure we have a valid URL by explicitly creating it from the import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')
const MOCK_STORAGE_DIR = path.join(FIXTURES_DIR, 'uploaded')
const FIXTURES_IMAGES_DIR = path.join(FIXTURES_DIR, 'images')
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT
const STORAGE_BUCKET = process.env.STORAGE_BUCKET
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY

function validateAuth(headers: Headers) {
	const authHeader = headers.get('Authorization')
	if (!authHeader) return false

	const [type, credentials] = authHeader.split(' ')
	if (type !== 'Basic' || !credentials) return false

	const decodedCredentials = atob(credentials)
	const [accessKey, secretKey] = decodedCredentials.split(':')
	return accessKey === STORAGE_ACCESS_KEY && secretKey === STORAGE_SECRET_KEY
}

function assertKey(key: any): asserts key is Array<string> {
	invariantResponse(
		Array.isArray(key) && key.length && key.every((k) => typeof k === 'string'),
		'Key must contain a directory',
	)
}

export const handlers = [
	http.put(
		`${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/:key*`,
		async ({ request, params }) => {
			if (!validateAuth(request.headers)) {
				return new HttpResponse('Unauthorized', { status: 401 })
			}
			const { key } = params

			assertKey(key)

			const filePath = path.join(MOCK_STORAGE_DIR, ...key)
			const parentDir = path.dirname(filePath)
			await fs.mkdir(parentDir, { recursive: true })

			const fileBuffer = Buffer.from(await request.arrayBuffer())
			await fs.writeFile(filePath, fileBuffer)

			return new HttpResponse(null, { status: 201 })
		},
	),

	http.get(
		`${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/:key*`,
		async ({ params }) => {
			const { key } = params
			assertKey(key)

			const filePath = path.join(MOCK_STORAGE_DIR, ...key)
			try {
				// Check tests/fixtures/images directory first
				const testFixturesPath = path.join(FIXTURES_IMAGES_DIR, ...key)
				let file: Buffer
				try {
					file = await fs.readFile(testFixturesPath)
				} catch {
					// If not found in test fixtures, try original path
					file = await fs.readFile(filePath)
				}

				const contentType =
					getMimeType(key.at(-1) || '') || 'application/octet-stream'
				return new HttpResponse(file, {
					headers: {
						'Content-Type': contentType,
						'Content-Length': file.length.toString(),
						'Cache-Control': 'public, max-age=31536000, immutable',
					},
				})
			} catch {
				return new HttpResponse('Not found', { status: 404 })
			}
		},
	),
]
