import fs from 'node:fs'
import { faker } from '@faker-js/faker'
import { type PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import { UniqueEnforcer } from 'enforce-unique'

const uniqueUsernameEnforcer = new UniqueEnforcer()

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = uniqueUsernameEnforcer
		.enforce(() => {
			return (
				faker.string.alphanumeric({ length: 2 }) +
				'_' +
				faker.internet.userName({
					firstName: firstName.toLowerCase(),
					lastName: lastName.toLowerCase(),
				})
			)
		})
		.slice(0, 20)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	}
}

export function createPassword(password: string = faker.internet.password()) {
	return {
		hash: bcrypt.hashSync(password, 10),
	}
}

let noteImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getNoteImages() {
	if (noteImages) return noteImages

	noteImages = await Promise.all([
		img({
			altText: 'a nice country house',
			filepath: './tests/fixtures/images/notes/0.png',
		}),
		img({
			altText: 'a city scape',
			filepath: './tests/fixtures/images/notes/1.png',
		}),
		img({
			altText: 'a sunrise',
			filepath: './tests/fixtures/images/notes/2.png',
		}),
		img({
			altText: 'a group of friends',
			filepath: './tests/fixtures/images/notes/3.png',
		}),
		img({
			altText: 'friends being inclusive of someone who looks lonely',
			filepath: './tests/fixtures/images/notes/4.png',
		}),
		img({
			altText: 'an illustration of a hot air balloon',
			filepath: './tests/fixtures/images/notes/5.png',
		}),
		img({
			altText:
				'an office full of laptops and other office equipment that look like it was abandoned in a rush out of the building in an emergency years ago.',
			filepath: './tests/fixtures/images/notes/6.png',
		}),
		img({
			altText: 'a rusty lock',
			filepath: './tests/fixtures/images/notes/7.png',
		}),
		img({
			altText: 'something very happy in nature',
			filepath: './tests/fixtures/images/notes/8.png',
		}),
		img({
			altText: `someone at the end of a cry session who's starting to feel a little better.`,
			filepath: './tests/fixtures/images/notes/9.png',
		}),
	])

	return noteImages
}

let userImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getUserImages() {
	if (userImages) return userImages

	userImages = await Promise.all(
		Array.from({ length: 10 }, (_, index) =>
			img({ filepath: `./tests/fixtures/images/user/${index}.jpg` }),
		),
	)

	return userImages
}

export async function img({
	altText,
	filepath,
}: {
	altText?: string
	filepath: string
}) {
	return {
		altText,
		contentType: filepath.endsWith('.png') ? 'image/png' : 'image/jpeg',
		blob: await fs.promises.readFile(filepath),
	}
}

let _migrationSqls: Array<Array<string>> | undefined
async function getMigrationSqls() {
	if (_migrationSqls) return _migrationSqls

	const migrationSqls: Array<Array<string>> = []
	const migrationPaths = (await fs.promises.readdir('prisma/migrations'))
		.filter((dir) => dir !== 'migration_lock.toml')
		.map((dir) => `prisma/migrations/${dir}/migration.sql`)

	for (const path of migrationPaths) {
		const sql = await fs.promises.readFile(path, 'utf8')
		const statements = sql
			.split(';')
			.map((statement) => statement.trim())
			.filter(Boolean)
		migrationSqls.push(statements)
	}

	_migrationSqls = migrationSqls

	return migrationSqls
}

export async function cleanupDb() {
	const db = new Database(process.env.DATABASE_URL!.replace('file:', ''))

	try {
		// Disable FK constraints to avoid relation conflicts during deletion
		db.exec('PRAGMA foreign_keys = OFF')

		// Get all table names
		const tables = db
			.prepare(
				`
			SELECT name FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations'
		`,
			)
			.all() as { name: string }[]

		// Delete tables except the ones that are excluded above
		for (const { name } of tables) {
			db.exec(`DROP TABLE IF EXISTS "${name}"`)
		}

		// Get migration SQLs and run each migration
		const migrationSqls = await getMigrationSqls()
		for (const statements of migrationSqls) {
			// Run each sql statement in the migration
			db.transaction(() => {
				for (const statement of statements) {
					db.exec(statement)
				}
			})()
		}
	} finally {
		db.exec('PRAGMA foreign_keys = ON')
		db.close()
	}
}
