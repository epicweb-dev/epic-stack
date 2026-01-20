---
name: epic-permissions
description: Guide on RBAC system and permissions for Epic Stack
categories:
  - permissions
  - rbac
  - access-control
---

# Epic Stack: Permissions

## When to use this skill

Use this skill when you need to:
- Implement role-based access control (RBAC)
- Validate permissions on server-side or client-side
- Create new permissions or roles
- Restrict access to routes or actions
- Implement granular permissions (`own` vs `any`)

## Patterns and conventions

### Permissions Philosophy

Following Epic Web principles:

**Explicit is better than implicit** - Always explicitly check permissions. Don't assume a user has access based on implicit rules or hidden logic. Every permission check should be visible and clear in the code.

**Example - Explicit permission checks:**
```typescript
// ✅ Good - Explicit permission check
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	
	// Explicitly check permission - clear and visible
	await requireUserWithPermission(request, 'delete:note:own')
	
	// Permission check is explicit and obvious
	await prisma.note.delete({ where: { id: noteId } })
}

// ❌ Avoid - Implicit permission check
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const note = await prisma.note.findUnique({ where: { id: noteId } })
	
	// Implicit check - not clear what permission is being checked
	if (note.ownerId !== userId) {
		throw new Response('Forbidden', { status: 403 })
	}
	// What permission does this represent? Not explicit
}
```

**Example - Explicit permission strings:**
```typescript
// ✅ Good - Explicit permission string
const permission: PermissionString = 'delete:note:own'
// Clear: action (delete), entity (note), access (own)

await requireUserWithPermission(request, permission)

// ❌ Avoid - Implicit or unclear permissions
const canDelete = checkUserCanDelete(user, note)
// What permission is this checking? Not explicit
```

### RBAC Model

Epic Stack uses an RBAC (Role-Based Access Control) model where:
- **Users** have **Roles**
- **Roles** have **Permissions**
- A user's permissions are the union of all permissions from their roles

### Permission Structure

Permissions follow the format: `action:entity:access`

**Components:**
- `action`: The allowed action (`create`, `read`, `update`, `delete`)
- `entity`: The entity being acted upon (`user`, `note`, etc.)
- `access`: The access level (`own`, `any`, `own,any`)

**Examples:**
- `create:note:own` - Can create own notes
- `read:note:any` - Can read any note
- `delete:user:any` - Can delete any user (admin)
- `update:note:own` - Can update only own notes

### Prisma Schema

**Models:**
```prisma
model Permission {
  id          String @id @default(cuid())
  action      String // e.g. create, read, update, delete
  entity      String // e.g. note, user, etc.
  access      String // e.g. own or any
  description String @default("")
  
  roles Role[]
  
  @@unique([action, entity, access])
}

model Role {
  id          String @id @default(cuid())
  name        String @unique
  description String @default("")
  
  users       User[]
  permissions Permission[]
}

model User {
  id    String @id @default(cuid())
  // ...
  roles Role[]
}
```

### Validate Permissions Server-Side

**Require specific permission:**
```typescript
import { requireUserWithPermission } from '#app/utils/permissions.server.ts'

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserWithPermission(
		request,
		'delete:note:own', // Throws 403 error if doesn't have permission
	)
	
	// User has the permission, continue...
}
```

**Require specific role:**
```typescript
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserWithRole(request, 'admin')
	
	// User has admin role, continue...
}
```

**Conditional permissions (own vs any) - explicit:**
```typescript
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	
	// Explicitly determine ownership
	const note = await prisma.note.findUnique({
		where: { id: noteId },
		select: { ownerId: true },
	})
	
	const isOwner = note.ownerId === userId
	
	// Explicitly check the appropriate permission based on ownership
	await requireUserWithPermission(
		request,
		isOwner ? 'delete:note:own' : 'delete:note:any', // Explicit permission string
	)
	
	// Permission check is explicit and clear
	// Proceed with deletion...
}
```

### Validate Permissions Client-Side

**Check if user has permission:**
```typescript
import { userHasPermission, useOptionalUser } from '#app/utils/user.ts'

export default function NoteRoute({ loaderData }: Route.ComponentProps) {
	const user = useOptionalUser()
	const isOwner = user?.id === loaderData.note.ownerId
	
	const canDelete = userHasPermission(
		user,
		isOwner ? 'delete:note:own' : 'delete:note:any',
	)
	
	return (
		<div>
			{canDelete && (
				<button onClick={handleDelete}>Delete</button>
			)}
		</div>
	)
}
```

**Check if user has role:**
```typescript
import { userHasRole } from '#app/utils/user.ts'

export default function AdminRoute() {
	const user = useOptionalUser()
	const isAdmin = userHasRole(user, 'admin')
	
	if (!isAdmin) {
		return <div>Access Denied</div>
	}
	
	return <div>Admin Panel</div>
}
```

### Create New Permissions

**En Prisma Studio o seed:**
```typescript
// prisma/seed.ts
await prisma.permission.create({
	data: {
		action: 'create',
		entity: 'post',
		access: 'own',
		description: 'Can create their own posts',
		roles: {
			connect: { name: 'user' },
		},
	},
})
```

**Permiso con múltiples niveles de acceso:**
```typescript
await prisma.permission.createMany({
	data: [
		{
			action: 'read',
			entity: 'post',
			access: 'own',
			description: 'Can read own posts',
		},
		{
			action: 'read',
			entity: 'post',
			access: 'any',
			description: 'Can read any post',
		},
	],
})
```

### Assign Roles to Users

**When creating user:**
```typescript
const user = await prisma.user.create({
	data: {
		email,
		username,
		roles: {
			connect: { name: 'user' }, // Assign 'user' role
		},
	},
})
```

**Assign multiple roles:**
```typescript
await prisma.user.update({
	where: { id: userId },
	data: {
		roles: {
			connect: [
				{ name: 'user' },
				{ name: 'moderator' },
			],
		},
	},
})
```

### Permissions and Roles Seed

**Seed example:**
```typescript
// prisma/seed.ts

// Create permissions
const permissions = await Promise.all([
	// User permissions
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
	prisma.permission.create({
		data: {
			action: 'update',
			entity: 'note',
			access: 'own',
			description: 'Can update own notes',
		},
	}),
	prisma.permission.create({
		data: {
			action: 'delete',
			entity: 'note',
			access: 'own',
			description: 'Can delete own notes',
		},
	}),
	// Admin permissions
	prisma.permission.create({
		data: {
			action: 'delete',
			entity: 'user',
			access: 'any',
			description: 'Can delete any user',
		},
	}),
])

// Create roles
const userRole = await prisma.role.create({
	data: {
		name: 'user',
		description: 'Standard user',
		permissions: {
			connect: permissions.slice(0, 4).map(p => ({ id: p.id })),
		},
	},
})

const adminRole = await prisma.role.create({
	data: {
		name: 'admin',
		description: 'Administrator',
		permissions: {
			connect: permissions.map(p => ({ id: p.id })),
		},
	},
})
```

### Permission Type

**Type-safe permission strings:**
```typescript
import { type PermissionString } from '#app/utils/user.ts'

// Tipo: 'create:note:own' | 'read:note:own' | etc.
const permission: PermissionString = 'delete:note:own'
```

**Parsear permission string:**
```typescript
import { parsePermissionString } from '#app/utils/user.ts'

const { action, entity, access } = parsePermissionString('delete:note:own')
// action: 'delete'
// entity: 'note'
// access: ['own']
```

## Common examples

### Example 1: Proteger action con permiso

```typescript
// app/routes/users/$username/notes/$noteId.tsx
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const { noteId } = Object.fromEntries(formData)
	
	const note = await prisma.note.findFirst({
		select: { id: true, ownerId: true, owner: { select: { username: true } } },
		where: { id: noteId },
	})
	
	if (!note) {
		throw new Response('Not found', { status: 404 })
	}
	
	const isOwner = note.ownerId === userId
	
	// Validate permiso según si es propietario o no
	await requireUserWithPermission(
		request,
		isOwner ? 'delete:note:own' : 'delete:note:any',
	)
	
	await prisma.note.delete({ where: { id: note.id } })
	
	return redirect(`/users/${note.owner.username}/notes`)
}
```

### Example 2: Mostrar UI condicional basada en permisos

```typescript
export default function NoteRoute({ loaderData }: Route.ComponentProps) {
	const user = useOptionalUser()
	const isOwner = user?.id === loaderData.note.ownerId
	
	const canDelete = userHasPermission(
		user,
		isOwner ? 'delete:note:own' : 'delete:note:any',
	)
	const canEdit = userHasPermission(
		user,
		isOwner ? 'update:note:own' : 'update:note:any',
	)
	
	return (
		<div>
			<h1>{loaderData.note.title}</h1>
			<p>{loaderData.note.content}</p>
			
			{(canEdit || canDelete) && (
				<div className="flex gap-2">
					{canEdit && (
						<Link to="edit">
							<Button>Edit</Button>
						</Link>
					)}
					{canDelete && (
						<DeleteNoteButton noteId={loaderData.note.id} />
					)}
				</div>
			)}
		</div>
	)
}
```

### Example 3: Ruta solo para admin

```typescript
// app/routes/admin/users.tsx
export async function loader({ request }: Route.LoaderArgs) {
	await requireUserWithRole(request, 'admin')
	
	const users = await prisma.user.findMany({
		select: {
			id: true,
			email: true,
			username: true,
		},
	})
	
	return { users }
}

export default function AdminUsersRoute({ loaderData }: Route.ComponentProps) {
	return (
		<div>
			<h1>All Users</h1>
			{loaderData.users.map(user => (
				<div key={user.id}>{user.username}</div>
			))}
		</div>
	)
}
```

### Example 4: Create new permission and assign it

```typescript
// Migración o seed
async function setupPostPermissions() {
	// Create post permissions
	const createOwn = await prisma.permission.create({
		data: {
			action: 'create',
			entity: 'post',
			access: 'own',
			description: 'Can create own posts',
		},
	})
	
	const readAny = await prisma.permission.create({
		data: {
			action: 'read',
			entity: 'post',
			access: 'any',
			description: 'Can read any post',
		},
	})
	
	// Assign to user role
	await prisma.role.update({
		where: { name: 'user' },
		data: {
			permissions: {
				connect: [
					{ id: createOwn.id },
					{ id: readAny.id },
				],
			},
		},
	})
}
```

## Common mistakes to avoid

- ❌ **Implicit permission checks**: Always explicitly check permissions - make permission requirements visible in code
- ❌ **Not validating permissions on server-side**: Always validate permissions in action/loader, never trust client-side only
- ❌ **Forgetting to verify `own` vs `any`**: Explicitly determine if user is owner before validating permission
- ❌ **Not using correct helpers**: Use `requireUserWithPermission` for server-side and `userHasPermission` for client-side - explicit helpers
- ❌ **Not creating unique permissions**: Use `@@unique([action, entity, access])` in schema - explicit permission structure
- ❌ **Assuming permissions instead of verifying**: Always verify explicitly, even if you think user has the permission
- ❌ **Not handling 403 errors**: Helpers throw errors that must be handled by ErrorBoundary
- ❌ **Not using types**: Use `PermissionString` type for type-safety - explicit types
- ❌ **Hidden permission logic**: Don't hide permission checks in utility functions - make them explicit at the call site

## References

- [Epic Stack Permissions Docs](../epic-stack/docs/permissions.md)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- [RBAC Explained](https://auth0.com/intro-to-iam/what-is-role-based-access-control-rbac)
- `app/utils/permissions.server.ts` - Server-side permission utilities
- `app/utils/user.ts` - Client-side permission utilities
- `prisma/schema.prisma` - Permission and Role models
- `prisma/seed.ts` - Permission seed examples
