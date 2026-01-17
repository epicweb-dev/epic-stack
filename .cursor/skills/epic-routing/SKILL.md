---
name: epic-routing
description: Guide on routing with React Router and react-router-auto-routes for Epic Stack
categories:
  - routing
  - react-router
  - file-based-routing
---

# Epic Stack: Routing

## When to use this skill

Use this skill when you need to:
- Create new routes or pages in an Epic Stack application
- Implement nested layouts
- Configure resource routes (routes without UI)
- Work with route parameters and search params
- Understand Epic Stack's file-based routing conventions
- Implement loaders and actions in routes

## Patterns and conventions

### Routing Philosophy

Following Epic Web principles:

**Do as little as possible** - Keep your route structure simple. Don't create complex nested routes unless you actually need them. Start simple and add complexity only when there's a clear benefit.

**Avoid over-engineering** - Don't create abstractions or complex route structures "just in case". Use the simplest structure that works for your current needs.

**Example - Simple route structure:**
```typescript
// ✅ Good - Simple, straightforward route
// app/routes/users/$username.tsx
export async function loader({ params }: Route.LoaderArgs) {
	const user = await prisma.user.findUnique({
		where: { username: params.username },
		select: { id: true, username: true, name: true },
	})
	return { user }
}

export default function UserRoute({ loaderData }: Route.ComponentProps) {
	return <div>{loaderData.user.name}</div>
}

// ❌ Avoid - Over-engineered route structure
// app/routes/users/$username/_layout.tsx
// app/routes/users/$username/index.tsx
// app/routes/users/$username/_components/UserHeader.tsx
// app/routes/users/$username/_components/UserDetails.tsx
// Unnecessary complexity for a simple user page
```

**Example - Add complexity only when needed:**
```typescript
// ✅ Good - Add nested routes only when you actually need them
// If you have user notes, then nested routes make sense:
// app/routes/users/$username/notes/_layout.tsx
// app/routes/users/$username/notes/index.tsx
// app/routes/users/$username/notes/$noteId.tsx

// ❌ Avoid - Creating nested routes "just in case"
// Don't create complex structures before you need them
```

### File-based routing with react-router-auto-routes

Epic Stack uses `react-router-auto-routes` instead of React Router's standard convention. This enables better organization and code co-location.

**Basic structure:**
```
app/routes/
├── _layout.tsx        # Layout for child routes
├── index.tsx          # Root route (/)
├── about.tsx          # Route /about
└── users/
    ├── _layout.tsx    # Layout for user routes
    ├── index.tsx      # Route /users
    └── $username/
        └── index.tsx  # Route /users/:username
```

**Configuration in `app/routes.ts`:**
```typescript
import { type RouteConfig } from '@react-router/dev/routes'
import { autoRoutes } from 'react-router-auto-routes'

export default autoRoutes({
	ignoredRouteFiles: [
		'.*',
		'**/*.css',
		'**/*.test.{js,jsx,ts,tsx}',
		'**/__*.*',
		'**/*.server.*',  // Co-located server utilities
		'**/*.client.*',  // Co-located client utilities
	],
}) satisfies RouteConfig
```

### Route Groups

Route groups are folders that start with `_` and don't affect the URL but help organize related code.

**Common examples:**
- `_auth/` - Authentication routes (login, signup, etc.)
- `_marketing/` - Marketing pages (home, about, etc.)
- `_seo/` - SEO routes (sitemap, robots.txt)

**Example:**
```
app/routes/
├── _auth/
│   ├── login.tsx          # URL: /login
│   ├── signup.tsx         # URL: /signup
│   └── forgot-password.tsx # URL: /forgot-password
└── _marketing/
    ├── index.tsx          # URL: /
    └── about.tsx          # URL: /about
```

### Route Parameters

Use `$` to indicate route parameters:

**Syntax:**
- `$param.tsx` → `:param` in URL
- `$username.tsx` → `:username` in URL

**Example route with parameter:**
```typescript
// app/routes/users/$username/index.tsx
export async function loader({ params }: Route.LoaderArgs) {
	const username = params.username // Type-safe!
	
	const user = await prisma.user.findUnique({
		where: { username },
	})
	
	return { user }
}
```

### Nested Layouts with `_layout.tsx`

Use `_layout.tsx` to create shared layouts for child routes.

**Example:**
```typescript
// app/routes/users/$username/notes/_layout.tsx
export async function loader({ params }: Route.LoaderArgs) {
	const owner = await prisma.user.findFirst({
		where: { username: params.username },
	})
	return { owner }
}

export default function NotesLayout({ loaderData }: Route.ComponentProps) {
	return (
		<main className="container">
			<h1>{loaderData.owner.name}'s Notes</h1>
			<Outlet /> {/* Child routes render here */}
		</main>
	)
}
```

Child routes (`$noteId.tsx`, `index.tsx`, etc.) will render where `<Outlet />` is.

### Resource Routes (Routes without UI)

Resource routes don't render UI; they only return data or perform actions.

**Characteristics:**
- Don't export a `default` component
- Export `loader` or `action` or both
- Useful for APIs, downloads, webhooks, etc.

**Example:**
```typescript
// app/routes/resources/healthcheck.tsx
export async function loader({ request }: Route.LoaderArgs) {
	// Check application health
	const host = request.headers.get('X-Forwarded-Host') ?? request.headers.get('host')
	
	try {
		await Promise.all([
			prisma.user.count(), // Check DB
			fetch(`${new URL(request.url).protocol}${host}`, {
				method: 'HEAD',
				headers: { 'X-Healthcheck': 'true' },
			}),
		])
		return new Response('OK')
	} catch (error) {
		return new Response('ERROR', { status: 500 })
	}
}
```

### Loaders and Actions

**Loaders** - Load data before rendering (GET requests)
**Actions** - Handle data mutations (POST, PUT, DELETE)

**Loader pattern:**
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	
	const data = await prisma.something.findMany({
		where: { userId },
	})
	
	return { data }
}

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
	return <div>{/* Use loaderData.data */}</div>
}
```

**Action pattern:**
```typescript
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	
	// Validate and process data
	await prisma.something.create({
		data: { /* ... */ },
	})
	
	return redirect('/success')
}

export default function RouteComponent() {
	return (
		<Form method="POST">
			{/* Form fields */}
		</Form>
	)
}
```

### Search Params

Access query parameters using `useSearchParams`:

```typescript
import { useSearchParams } from 'react-router'

export default function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const query = searchParams.get('q') || ''
	const page = Number(searchParams.get('page') || '1')
	
	return (
		<div>
			<input
				value={query}
				onChange={(e) => setSearchParams({ q: e.target.value })}
			/>
			{/* Results */}
		</div>
	)
}
```

### Code Co-location

Epic Stack encourages placing related code close to where it's used.

**Typical structure:**
```
app/routes/users/$username/notes/
├── _layout.tsx              # Layout with loader
├── index.tsx                # Notes list
├── $noteId.tsx              # Note view
├── $noteId_.edit.tsx        # Edit note
├── +shared/                 # Code shared between routes
│   └── note-editor.tsx      # Shared editor
└── $noteId.server.ts        # Server-side utilities
```

The `+` prefix indicates co-located modules that are not routes.

### Naming Conventions

- `_layout.tsx` - Layout for child routes
- `index.tsx` - Root route of the segment
- `$param.tsx` - Route parameter
- `$param_.action.tsx` - Route with parameter + action (using `_`)
- `[.]ext.tsx` - Resource route (e.g., `robots[.]txt.ts`)

## Common examples

### Example 1: Create a basic route with layout

```typescript
// app/routes/products/_layout.tsx
export async function loader({ request }: Route.LoaderArgs) {
	const categories = await prisma.category.findMany()
	return { categories }
}

export default function ProductsLayout({ loaderData }: Route.ComponentProps) {
	return (
		<div>
			<nav>
				{loaderData.categories.map(cat => (
					<Link key={cat.id} to={`/products/${cat.slug}`}>
						{cat.name}
					</Link>
				))}
			</nav>
			<Outlet />
		</div>
	)
}

// app/routes/products/index.tsx
export default function ProductsIndex() {
	return <div>Products list</div>
}
```

### Example 2: Route with dynamic parameter

```typescript
// app/routes/products/$slug.tsx
export async function loader({ params }: Route.LoaderArgs) {
	const product = await prisma.product.findUnique({
		where: { slug: params.slug },
	})
	
	if (!product) {
		throw new Response('Not Found', { status: 404 })
	}
	
	return { product }
}

export default function ProductPage({ loaderData }: Route.ComponentProps) {
	return (
		<div>
			<h1>{loaderData.product.name}</h1>
			<p>{loaderData.product.description}</p>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>Product "{params.slug}" not found</p>
				),
			}}
		/>
	)
}
```

### Example 3: Resource route for download

```typescript
// app/routes/resources/download-report.tsx
export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	
	const report = await generateReport(userId)
	
	return new Response(report, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'attachment; filename="report.pdf"',
		},
	})
}
```

### Example 4: Route with multiple nested parameters

```typescript
// app/routes/users/$username/posts/$postId/comments/$commentId.tsx
export async function loader({ params }: Route.LoaderArgs) {
	// params contains: { username, postId, commentId }
	const comment = await prisma.comment.findUnique({
		where: { id: params.commentId },
		include: {
			post: {
				include: { author: true },
			},
		},
	})
	
	return { comment }
}
```

## Common mistakes to avoid

- ❌ **Over-engineering route structure**: Keep routes simple - don't create complex nested structures unless you actually need them
- ❌ **Creating abstractions prematurely**: Start with simple routes, add complexity only when there's a clear benefit
- ❌ **Using React Router's standard convention**: Epic Stack uses `react-router-auto-routes`, not the standard convention
- ❌ **Exporting default component in resource routes**: Resource routes should not export components
- ❌ **Not using nested layouts when needed**: Use `_layout.tsx` when you have shared UI, but don't create layouts unnecessarily
- ❌ **Forgetting `<Outlet />` in layouts**: Without `<Outlet />`, child routes won't render
- ❌ **Using incorrect names for parameters**: Should be `$param.tsx`, not `:param.tsx` or `[param].tsx`
- ❌ **Mixing route groups with URLs**: Groups (`_auth/`) don't appear in the URL
- ❌ **Not validating params**: Always validate that parameters exist before using them
- ❌ **Duplicating route logic**: Use layouts and shared components, but only when it reduces duplication

## References

- [Epic Stack Routing Docs](../epic-stack/docs/routing.md)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- [React Router Auto Routes](https://github.com/kenn/react-router-auto-routes)
- `app/routes.ts` - Auto-routes configuration
- `app/routes/users/$username/notes/_layout.tsx` - Example of nested layout
- `app/routes/resources/healthcheck.tsx` - Example of resource route
- `app/routes/_auth/login.tsx` - Example of route in route group
