import os from 'node:os'
import path from 'node:path'
import { threadId } from 'node:worker_threads'

const workerId =
	process.env.VITEST_WORKER_ID ??
	process.env.VITEST_POOL_ID ??
	String(threadId)

process.env.LITEFS_DIR ??= path.join(os.tmpdir(), 'epic-stack-litefs')
process.env.CACHE_DATABASE_PATH ??= path.join(
	os.tmpdir(),
	`epic-stack-cache-${process.pid}-${workerId}.db`,
)
