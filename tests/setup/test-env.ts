import os from 'node:os'
import path from 'node:path'
import { threadId } from 'node:worker_threads'

const workerId =
	process.env.VITEST_WORKER_ID ??
	process.env.VITEST_POOL_ID ??
	String(threadId)

process.env.LITEFS_DIR ??= path.join(os.tmpdir(), 'epic-stack-litefs')
process.env.CACHE_DATABASE_PATH = path.join(
	os.tmpdir(),
	`epic-stack-cache-${process.pid}-${workerId}.db`,
)
process.env.DATABASE_PATH ??= './prisma/data.db'
process.env.DATABASE_URL ??= 'file:./data.db?connection_limit=1'
process.env.SESSION_SECRET ??= 'test-session-secret'
process.env.INTERNAL_COMMAND_TOKEN ??= 'test-internal-token'
process.env.HONEYPOT_SECRET ??= 'test-honeypot-secret'
process.env.AWS_ACCESS_KEY_ID ??= 'test-access-key'
process.env.AWS_SECRET_ACCESS_KEY ??= 'test-secret-key'
process.env.AWS_REGION ??= 'auto'
process.env.AWS_ENDPOINT_URL_S3 ??= 'https://fly.storage.tigris.dev'
process.env.BUCKET_NAME ??= 'test-bucket'
