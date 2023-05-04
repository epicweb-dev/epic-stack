import { z } from 'zod'
import { prisma } from '~/utils/db.server'

/**
 * Deletes all data from all tables in the database, (except for the
 * _prisma_migrations table). This function ensures that the tables are deleted
 * in the correct order to avoid foreign key constraint errors.
 *
 * Run this between tests to ensure that the database is in a clean state. This
 * will keep your tests isolated from each other.
 *
 * NOTE: It's better than deleting the database and recreating it because it
 * doesn't require you to re-run migrations.
 */
export async function deleteAllData() {
	const excludedTables = ['_prisma_migrations']
	// Get a list of all tables in the database
	const allTableNamesRaw = await prisma.$queryRaw`
		SELECT name
		FROM sqlite_master
		WHERE
			type='table'
			AND name NOT IN (${excludedTables.join(',')})
	`

	const allTableNames = z
		.array(z.object({ name: z.string() }))
		.parse(allTableNamesRaw)
		.map(({ name }) => name)

	// Get a list of foreign key constraints for each table
	// p.s. thanks chatgpt...
	const foreignKeysRaw = await prisma.$queryRaw`
		SELECT
			m.name as table_name,
			p."table" as parent_table_name
		FROM
			sqlite_master AS m
		JOIN
			pragma_foreign_key_list(m.name) AS p
		WHERE
			m.type = 'table' AND
			m.name NOT IN (${excludedTables.join(',')})
		`
	const foreignKeys = z
		.array(
			z.object({
				table_name: z.string(),
				parent_table_name: z.string(),
			}),
		)
		.parse(foreignKeysRaw)

	// Build a dependency graph for the tables
	const graph: { [key: string]: Set<string> } = {}
	for (const tableName of allTableNames) {
		graph[tableName] = new Set()
	}
	for (const { table_name, parent_table_name } of foreignKeys) {
		graph[parent_table_name].add(table_name)
	}

	// Topologically sort the tables
	const sortedTableNames: Array<string> = []
	const visited = new Set()
	const visit = (tableName: string) => {
		if (visited.has(tableName)) {
			return
		}
		visited.add(tableName)
		for (const dependentTableName of graph[tableName]) {
			visit(dependentTableName)
		}
		sortedTableNames.push(tableName)
	}
	for (const tableName of allTableNames) {
		visit(tableName)
	}

	// Delete all data in each table in the proper order
	for (const tableName of sortedTableNames) {
		// For some reason, we need to use Unsafe because the $executeRaw didn't
		// like this query (resulted in a syntax error). Don't worry, it's safe...
		await prisma.$executeRawUnsafe(`DELETE FROM ${tableName};`)
	}
}
