---
name: epic-database
description: Guide on Prisma, SQLite, and LiteFS for Epic Stack
categories:
  - database
  - prisma
  - sqlite
  - litefs
---

# Epic Stack: Database

## When to use this skill

Use this skill when you need to:

- Design database schema with Prisma
- Create migrations
- Work with SQLite and LiteFS
- Optimize queries and performance
- Create seed scripts
- Work with multi-region deployments
- Manage backups and restores

## Patterns and conventions

### Database Philosophy

Following Epic Web principles:

**Do as little as possible** - Only fetch the data you actually need. Use
`select` to fetch specific fields instead of entire models. Avoid over-fetching
data "just in case" - fetch what you need, when you need it.

**Pragmatism over purity** - Optimize queries when there's a measurable benefit,
but don't over-optimize prematurely. Simple, readable queries are often better
than complex optimized ones. Add indexes when queries are slow, not before.

**Example - Fetch only what you need:**

```typescript
// ✅ Good - Fetch only needed fields
const user = await prisma.user.findUnique({
	where: { id: userId },
	select: {
		id: true,
		username: true,
		name: true,
		// Only fetch what you actually use
	},
})

// ❌ Avoid - Fetching everything
const user = await prisma.user.findUnique({
	where: { id: userId },
	// Fetches all fields including password hash, email, etc.
})
```

**Example - Pragmatic optimization:**

```typescript
// ✅ Good - Simple query first, optimize if needed
const notes = await prisma.note.findMany({
	where: { ownerId: userId },
	select: { id: true, title: true, updatedAt: true },
	orderBy: { updatedAt: 'desc' },
	take: 20,
})

// Only add indexes if this query is actually slow
// Don't pre-optimize

// ❌ Avoid - Over-optimizing before measuring
// Adding complex indexes, joins, etc. before knowing if it's needed
```

### Prisma Schema

Epic Stack uses Prisma with SQLite as the database.

**Basic configuration:**

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["typedSql"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Basic model:**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  name      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  notes     Note[]
  roles     Role[]
}

model Note {
  id      String @id @default(cuid())
  title   String
  content String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner   User   @relation(fields: [ownerId], references: [id])
  ownerId String

  @@index([ownerId])
  @@index([ownerId, updatedAt])
}
```

### CUID2 for IDs

Epic Stack uses CUID2 to generate unique IDs.

**Advantages:**

- Globally unique
- Sortable
- Secure (no exposed information)
- URL-friendly

**Example:**

```prisma
model User {
  id String @id @default(cuid()) // Automatically generates CUID2
}
```

### Timestamps

**Standard fields:**

```prisma
model User {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt // Automatically updated
}
```

### Relationships

**One-to-Many:**

```prisma
model User {
  id    String @id @default(cuid())
  notes Note[]
}

model Note {
  id      String @id @default(cuid())
  owner   User   @relation(fields: [ownerId], references: [id])
  ownerId String

  @@index([ownerId])
}
```

**One-to-One:**

```prisma
model User {
  id      String  @id @default(cuid())
  image   UserImage?
}

model UserImage {
  id        String @id @default(cuid())
  user      User   @relation(fields: [userId], references: [id])
  userId    String @unique
}
```

**Many-to-Many:**

```prisma
model User {
  id    String @id @default(cuid())
  roles Role[]
}

model Role {
  id    String @id @default(cuid())
  users User[]
}
```

### Indexes

**Create indexes:**

```prisma
model Note {
  id      String @id @default(cuid())
  ownerId String
  updatedAt DateTime

  @@index([ownerId])              // Simple index
  @@index([ownerId, updatedAt])   // Composite index
}
```

**Best practices:**

- Index foreign keys
- Index fields used in `where` frequently
- Index fields used in `orderBy`
- Use composite indexes for complex queries

### Cascade Delete

**Configure cascade:**

```prisma
model User {
  id    String @id @default(cuid())
  notes Note[]
}

model Note {
  id      String @id @default(cuid())
  owner   User   @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ownerId String
}
```

**Options:**

- `onDelete: Cascade` - Deletes children when parent is deleted
- `onDelete: SetNull` - Sets to null when parent is deleted
- `onDelete: Restrict` - Prevents deletion if there are children

### Migrations

**Create migration:**

```bash
npx prisma migrate dev --name add_user_field
```

**Apply migrations in production:**

```bash
npx prisma migrate deploy
```

**Automatic migrations:** Migrations are automatically applied on deploy via
`litefs.yml`.

**"Widen then Narrow" strategy for zero-downtime:**

1. **Widen app** - App accepts A or B
2. **Widen db** - DB provides A and B, app writes to both
3. **Narrow app** - App only uses B
4. **Narrow db** - DB only provides B

**Example: Rename field `name` to `firstName` and `lastName`:**

```prisma
// Step 1: Widen app (accepts both)
model User {
  id        String @id @default(cuid())
  name      String?  // Deprecated
  firstName String?  // New
  lastName  String?  // New
}

// Step 2: Widen db (migration copies data)
// In SQL migration:
ALTER TABLE User ADD COLUMN firstName TEXT;
ALTER TABLE User ADD COLUMN lastName TEXT;
UPDATE User SET firstName = name;

// Step 3: Narrow app (only uses new fields)
// Code only uses firstName and lastName

// Step 4: Narrow db (removes old field)
ALTER TABLE User DROP COLUMN name;
```

### Prisma Client

**Import Prisma Client:**

```typescript
import { prisma } from '#app/utils/db.server.ts'
```

**Basic query:**

```typescript
const user = await prisma.user.findUnique({
	where: { id: userId },
})
```

**Specific select:**

```typescript
const user = await prisma.user.findUnique({
	where: { id: userId },
	select: {
		id: true,
		email: true,
		username: true,
		// Don't include password or sensitive data
	},
})
```

**Include relations:**

```typescript
const user = await prisma.user.findUnique({
	where: { id: userId },
	include: {
		notes: {
			select: {
				id: true,
				title: true,
			},
			orderBy: { updatedAt: 'desc' },
		},
		roles: true,
	},
})
```

**Complex queries:**

```typescript
const notes = await prisma.note.findMany({
	where: {
		ownerId: userId,
		title: { contains: searchTerm },
	},
	select: {
		id: true,
		title: true,
		updatedAt: true,
	},
	orderBy: { updatedAt: 'desc' },
	take: 20,
	skip: (page - 1) * 20,
})
```

### Transactions

**Use transactions:**

```typescript
await prisma.$transaction(async (tx) => {
	const user = await tx.user.create({
		data: {
			email,
			username,
			roles: { connect: { name: 'user' } },
		},
	})

	await tx.note.create({
		data: {
			title: 'Welcome',
			content: 'Welcome to the app!',
			ownerId: user.id,
		},
	})

	return user
})
```

### SQLite con LiteFS

**Multi-region with LiteFS:**

- Only the primary instance can write
- Replicas can only read
- Writes are automatically replicated

**Check primary instance:**

```typescript
import { ensurePrimary, getInstanceInfo } from '#app/utils/litefs.server.ts'

export async function action({ request }: Route.ActionArgs) {
	// Ensure we're on primary instance for writes
	await ensurePrimary()

	// Now we can write safely
	await prisma.user.create({
		data: {
			/* ... */
		},
	})
}
```

**Get instance information:**

```typescript
import { getInstanceInfo } from '#app/utils/litefs.server.ts'

const { currentIsPrimary, primaryInstance } = await getInstanceInfo()

if (currentIsPrimary) {
	// Can write
} else {
	// Read-only, redirect to primary if necessary
}
```

### Seed Scripts

**Create seed:**

```typescript
// prisma/seed.ts
import { prisma } from '#app/utils/db.server.ts'

async function seed() {
	// Create roles
	await prisma.role.createMany({
		data: [
			{ name: 'user', description: 'Standard user' },
			{ name: 'admin', description: 'Administrator' },
		],
	})

	// Create users
	const user = await prisma.user.create({
		data: {
			email: 'user@example.com',
			username: 'testuser',
			roles: { connect: { name: 'user' } },
		},
	})

	console.log('Seed complete!')
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
```

**Run seed:**

```bash
npx prisma db seed
# Or directly:
npx tsx prisma/seed.ts
```

### Query Optimization

**Guidelines (pragmatic approach):**

- Use `select` to fetch only needed fields - do as little as possible
- Use selective `include` - only include relations you actually use
- Index fields used in `where` and `orderBy` - but only if queries are slow
- Use composite indexes for complex queries - when you have a real performance
  problem
- Avoid `select: true` (fetches everything) - be explicit about what you need
- Measure first, optimize second - don't pre-optimize

**Optimized example (do as little as possible):**

```typescript
// ❌ Avoid: Fetches everything unnecessarily
const user = await prisma.user.findUnique({
	where: { id: userId },
	// Fetches password hash, email, all relations, etc.
})

// ✅ Good: Only needed fields - do as little as possible
const user = await prisma.user.findUnique({
	where: { id: userId },
	select: {
		id: true,
		username: true,
		name: true,
		// Only what you actually use
	},
})

// ✅ Better: With selective relations (only if you need them)
const user = await prisma.user.findUnique({
	where: { id: userId },
	select: {
		id: true,
		username: true,
		notes: {
			select: {
				id: true,
				title: true,
			},
			take: 10, // Only fetch what you need
		},
	},
})
```

### Prisma Query Logging

**Configure logging:**

```typescript
// app/utils/db.server.ts
const client = new PrismaClient({
	log: [
		{ level: 'query', emit: 'event' },
		{ level: 'error', emit: 'stdout' },
		{ level: 'warn', emit: 'stdout' },
	],
})

client.$on('query', async (e) => {
	if (e.duration < 20) return // Only log slow queries

	console.info(`prisma:query - ${e.duration}ms - ${e.query}`)
})
```

### Database URL

**Development:**

```bash
DATABASE_URL=file:./data/db.sqlite
```

**Production (Fly.io):**

```bash
DATABASE_URL=file:/litefs/data/sqlite.db
```

### Connecting to DB in Production

**SSH to Fly instance:**

```bash
fly ssh console --app [YOUR_APP_NAME]
```

**Connect to DB CLI:**

```bash
fly ssh console -C database-cli --app [YOUR_APP_NAME]
```

**Prisma Studio:**

```bash
# Terminal 1: Start Prisma Studio
fly ssh console -C "npx prisma studio" -s --app [YOUR_APP_NAME]

# Terminal 2: Local proxy
fly proxy 5556:5555 --app [YOUR_APP_NAME]

# Open in browser
# http://localhost:5556
```

## Common examples

### Example 1: Create model with relations

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId String

  comments Comment[]
  tags     Tag[]

  @@index([authorId])
  @@index([authorId, published])
  @@index([published, updatedAt])
}

model Comment {
  id      String @id @default(cuid())
  content String

  createdAt DateTime @default(now())

  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String

  author   User   @relation(fields: [authorId], references: [id])
  authorId String

  @@index([postId])
  @@index([authorId])
}
```

### Example 2: Complex query with pagination

```typescript
export async function getPosts({
	userId,
	page = 1,
	perPage = 20,
	published,
}: {
	userId?: string
	page?: number
	perPage?: number
	published?: boolean
}) {
	const where: Prisma.PostWhereInput = {}

	if (userId) {
		where.authorId = userId
	}
	if (published !== undefined) {
		where.published = published
	}

	const [posts, total] = await Promise.all([
		prisma.post.findMany({
			where,
			select: {
				id: true,
				title: true,
				updatedAt: true,
				author: {
					select: {
						id: true,
						username: true,
					},
				},
			},
			orderBy: { updatedAt: 'desc' },
			take: perPage,
			skip: (page - 1) * perPage,
		}),
		prisma.post.count({ where }),
	])

	return {
		posts,
		total,
		pages: Math.ceil(total / perPage),
	}
}
```

### Example 3: Transaction with multiple operations

```typescript
export async function createPostWithTags({
	authorId,
	title,
	content,
	tagNames,
}: {
	authorId: string
	title: string
	content: string
	tagNames: string[]
}) {
	return await prisma.$transaction(async (tx) => {
		// Create tags if they don't exist
		await Promise.all(
			tagNames.map((name) =>
				tx.tag.upsert({
					where: { name },
					update: {},
					create: { name },
				}),
			),
		)

		// Create post
		const post = await tx.post.create({
			data: {
				title,
				content,
				authorId,
				tags: {
					connect: tagNames.map((name) => ({ name })),
				},
			},
		})

		return post
	})
}
```

### Example 4: Seed with related data

```typescript
async function seed() {
	// Create permissions
	const permissions = await Promise.all([
		prisma.permission.create({
			data: {
				action: 'create',
				entity: 'note',
				access: 'own',
				description: 'Can create own notes',
			},
		}),
		prisma.permission.create({
			data: {
				action: 'read',
				entity: 'note',
				access: 'own',
				description: 'Can read own notes',
			},
		}),
	])

	// Create roles with permissions
	const userRole = await prisma.role.create({
		data: {
			name: 'user',
			description: 'Standard user',
			permissions: {
				connect: permissions.map((p) => ({ id: p.id })),
			},
		},
	})

	// Create user with role
	const user = await prisma.user.create({
		data: {
			email: 'user@example.com',
			username: 'testuser',
			roles: {
				connect: { id: userRole.id },
			},
		},
	})

	console.log('Seed complete!')
}
```

## Common mistakes to avoid

- ❌ **Fetching unnecessary data**: Use `select` to fetch only what you need -
  do as little as possible
- ❌ **Over-optimizing prematurely**: Measure first, then optimize. Don't add
  indexes "just in case"
- ❌ **Not using indexes when needed**: Index foreign keys and fields used in
  frequent queries, but only if they're actually slow
- ❌ **N+1 queries**: Use `include` to fetch relations in a single query when
  you need them
- ❌ **Not using transactions for related operations**: Always use transactions
  when multiple operations must be atomic
- ❌ **Writing from replicas**: Verify `ensurePrimary()` before writes in
  production
- ❌ **Breaking migrations without strategy**: Use "widen then narrow" for
  zero-downtime
- ❌ **Not validating data before inserting**: Always validate with Zod before
  create/update
- ❌ **Forgetting `onDelete` in relations**: Explicitly decide what to do when
  parent is deleted
- ❌ **Not using CUID2**: Epic Stack uses CUID2 by default, don't use UUID or
  others
- ❌ **Not closing Prisma Client**: Prisma handles this automatically, but
  ensure in scripts
- ❌ **Complex queries when simple ones work**: Prefer simple, readable queries
  over complex optimized ones unless there's a real problem

## References

- [Epic Stack Database Docs](../epic-stack/docs/database.md)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- [Prisma Documentation](https://www.prisma.io/docs)
- [LiteFS Documentation](https://fly.io/docs/litefs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- `prisma/schema.prisma` - Complete schema
- `prisma/seed.ts` - Seed example
- `app/utils/db.server.ts` - Prisma Client setup
- `app/utils/litefs.server.ts` - LiteFS utilities
