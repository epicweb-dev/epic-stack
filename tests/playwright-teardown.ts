import * as fileSystem from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type FullConfig } from '@playwright/test'
import { addCoverageReport } from 'monocart-reporter'

type V8CoverageFile = {
	result: Array<{ url?: string } & Record<string, unknown>>
}

function readJsonFile<T>(absoluteFilePath: string): T {
	return JSON.parse(fileSystem.readFileSync(absoluteFilePath, 'utf-8')) as T
}

export default async function globalTeardown(
	playwrightConfig: FullConfig,
): Promise<void> {
	const nodeV8CoverageDirectory = process.env.NODE_V8_COVERAGE
	if (!nodeV8CoverageDirectory) return
	if (!fileSystem.existsSync(nodeV8CoverageDirectory)) return

	const coverageFileNames = fileSystem.readdirSync(nodeV8CoverageDirectory)

	for (const coverageFileName of coverageFileNames) {
		const coverageFilePath = path.resolve(
			nodeV8CoverageDirectory,
			coverageFileName,
		)
		const parsedCoverage = readJsonFile<V8CoverageFile>(coverageFilePath)

		const coverageEntriesWithSource = (parsedCoverage.result ?? [])
			.filter(
				(entry) =>
					typeof entry.url === 'string' && entry.url.startsWith('file:'),
			)
			.map((entry) => {
				const absoluteSourcePath = fileURLToPath(entry.url as string)
				return {
					...entry,
					source: fileSystem.readFileSync(absoluteSourcePath, 'utf-8'),
				}
			})

		if (coverageEntriesWithSource.length === 0) continue

		await addCoverageReport(coverageEntriesWithSource, {
			config: playwrightConfig,
		} as unknown as never)
	}
}
