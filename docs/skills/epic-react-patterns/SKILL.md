---
name: epic-react-patterns
description: Guide on React patterns, performance optimization, and code quality for Epic Stack
categories:
  - react
  - performance
  - patterns
  - optimization
---

# Epic Stack: React Patterns and Guidelines

## When to use this skill

Use this skill when you need to:
- Write efficient React components in Epic Stack applications
- Optimize performance and bundle size
- Follow React Router patterns and conventions
- Avoid common React anti-patterns
- Implement proper code splitting
- Optimize re-renders and data fetching
- Use React hooks correctly

## Philosophy

Following Epic Web principles:
- **Make it work, make it right, make it fast** - In that order. First make it functional, then refactor for clarity, then optimize for performance.
- **Pragmatism over purity** - Choose practical solutions that work well in your context rather than theoretically perfect ones.
- **Optimize for sustainable velocity** - Write code that's easy to maintain and extend, not just fast to write initially.
- **Do as little as possible** - Only add complexity when it provides real value.

## Patterns and conventions

### Data Fetching in React Router

Epic Stack uses React Router loaders for data fetching, not `useEffect`.

**✅ Good - Use loaders:**
```typescript
// app/routes/users/$username.tsx
export async function loader({ params }: Route.LoaderArgs) {
	const user = await prisma.user.findUnique({
		where: { username: params.username },
	})
	return { user }
}

export default function UserRoute({ loaderData }: Route.ComponentProps) {
	return <div>{loaderData.user.name}</div>
}
```

**❌ Avoid - Don't fetch in useEffect:**
```typescript
// ❌ Don't do this
export default function UserRoute({ params }: Route.ComponentProps) {
	const [user, setUser] = useState(null)

	useEffect(() => {
		fetch(`/api/users/${params.username}`)
			.then(res => res.json())
			.then(setUser)
	}, [params.username])

	return user ? <div>{user.name}</div> : <div>Loading...</div>
}
```

### Avoid useEffect for Side Effects

[You Might Not Need `useEffect`](https://react.dev/learn/you-might-not-need-an-effect)

Instead of using `useEffect`, use event handlers, CSS, ref callbacks, or `useSyncExternalStore`.

**✅ Good - Use event handlers:**
```typescript
function ProductPage({ product, addToCart }: Route.ComponentProps) {
	function buyProduct() {
		addToCart(product)
		showNotification(`Added ${product.name} to cart!`)
	}

	function handleBuyClick() {
		buyProduct()
	}

	function handleCheckoutClick() {
		buyProduct()
		navigate('/checkout')
	}

	return (
		<div>
			<button onClick={handleBuyClick}>Buy Now</button>
			<button onClick={handleCheckoutClick}>Checkout</button>
		</div>
	)
}
```

**❌ Avoid - Side effects in useEffect:**
```typescript
// ❌ Don't do this
function ProductPage({ product, addToCart }: Route.ComponentProps) {
	useEffect(() => {
		if (product.isInCart) {
			showNotification(`Added ${product.name} to cart!`)
		}
	}, [product])

	function handleBuyClick() {
		addToCart(product)
	}

	// ...
}
```

**✅ Appropriate use of useEffect:**
```typescript
// ✅ Good - Event listeners are appropriate
useEffect(() => {
	const controller = new AbortController()

	window.addEventListener(
		'keydown',
		(event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			// handle escape key
		},
		{ signal: controller.signal },
	)

	return () => {
		controller.abort()
	}
}, [])
```

### Code Splitting with React Router

React Router automatically code-splits by route. Use dynamic imports for heavy components.

**✅ Good - Dynamic imports:**
```typescript
// app/routes/admin/dashboard.tsx
import { lazy } from 'react'

const AdminChart = lazy(() => import('#app/components/admin/chart.tsx'))

export default function AdminDashboard() {
	return (
		<Suspense fallback={<div>Loading chart...</div>}>
			<AdminChart />
		</Suspense>
	)
}
```

### Optimizing Re-renders

**✅ Good - Memoize expensive computations:**
```typescript
import { useMemo } from 'react'

function UserList({ users }: { users: User[] }) {
	const sortedUsers = useMemo(() => {
		return [...users].sort((a, b) => a.name.localeCompare(b.name))
	}, [users])

	return (
		<ul>
			{sortedUsers.map(user => (
				<li key={user.id}>{user.name}</li>
			))}
		</ul>
	)
}
```

**✅ Good - Memoize callbacks:**
```typescript
import { useCallback } from 'react'

function NoteEditor({ noteId, onSave }: { noteId: string; onSave: (note: Note) => void }) {
	const handleSave = useCallback((note: Note) => {
		onSave(note)
	}, [onSave])

	return <Editor onSave={handleSave} />
}
```

**❌ Avoid - Unnecessary memoization:**
```typescript
// ❌ Don't memoize simple values
const count = useMemo(() => items.length, [items]) // Just use items.length directly

// ❌ Don't memoize simple callbacks
const handleClick = useCallback(() => {
	console.log('clicked')
}, []) // Just define the function normally if it doesn't need memoization
```

### Bundle Size Optimization

**✅ Good - Import only what you need:**
```typescript
// ✅ Import specific functions
import { useSearchParams } from 'react-router'
import { parseWithZod } from '@conform-to/zod'
```

**❌ Avoid - Barrel imports:**
```typescript
// ❌ Don't import entire libraries if you only need one thing
import * as ReactRouter from 'react-router'
import * as Conform from '@conform-to/zod'
```

### Form Handling with Conform

**✅ Good - Use Conform for forms:**
```typescript
import { useForm, getFormProps } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form } from 'react-router'

const SignupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
})

export default function SignupRoute({ actionData }: Route.ComponentProps) {
	const [form, fields] = useForm({
		id: 'signup-form',
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignupSchema })
		},
	})

	return (
		<Form method="POST" {...getFormProps(form)}>
			{/* form fields */}
		</Form>
	)
}
```

### Component Composition

**✅ Good - Compose components:**
```typescript
function UserProfile({ user }: { user: User }) {
	return (
		<Card>
			<UserHeader user={user} />
			<UserDetails user={user} />
			<UserActions userId={user.id} />
		</Card>
	)
}
```

**❌ Avoid - Large monolithic components:**
```typescript
// ❌ Don't put everything in one component
function UserProfile({ user }: { user: User }) {
	return (
		<div className="card">
			<div className="header">
				<img src={user.avatar} alt={user.name} />
				<h1>{user.name}</h1>
			</div>
			<div className="details">
				<p>{user.email}</p>
				<p>{user.bio}</p>
			</div>
			<div className="actions">
				<button>Edit</button>
				<button>Delete</button>
			</div>
		</div>
	)
}
```

### Error Boundaries

**✅ Good - Use error boundaries:**
```typescript
// app/routes/users/$username.tsx
export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>User "{params.username}" not found</p>
				),
			}}
		/>
	)
}
```

### TypeScript Guidelines

**✅ Good - Type props explicitly:**
```typescript
interface UserCardProps {
	user: {
		id: string
		name: string
		email: string
	}
	onEdit?: (userId: string) => void
}

function UserCard({ user, onEdit }: UserCardProps) {
	return (
		<div>
			<h2>{user.name}</h2>
			<p>{user.email}</p>
			{onEdit && <button onClick={() => onEdit(user.id)}>Edit</button>}
		</div>
	)
}
```

**✅ Good - Use Route types:**
```typescript
import type { Route } from './+types/users.$username'

export async function loader({ params }: Route.LoaderArgs) {
	// params is type-safe!
	const user = await prisma.user.findUnique({
		where: { username: params.username },
	})
	return { user }
}

export default function UserRoute({ loaderData }: Route.ComponentProps) {
	// loaderData is type-safe!
	return <div>{loaderData.user.name}</div>
}
```

### Loading States

**✅ Good - Use React Router's pending states:**
```typescript
import { useNavigation } from 'react-router'

function NoteForm() {
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'

	return (
		<Form method="POST">
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Saving...' : 'Save'}
			</button>
		</Form>
	)
}
```

### Preventing Data Fetching Waterfalls

React Router loaders can prevent waterfalls by fetching data in parallel.

**❌ Avoid - Sequential data fetching (waterfall):**
```typescript
// ❌ Don't do this - creates a waterfall
export async function loader({ params }: Route.LoaderArgs) {
	const user = await prisma.user.findUnique({
		where: { username: params.username },
	})
	// Second fetch waits for first to complete
	const notes = await prisma.note.findMany({
		where: { ownerId: user.id },
	})
	return { user, notes }
}
```

**✅ Good - Parallel data fetching:**
```typescript
// ✅ Fetch data in parallel
export async function loader({ params }: Route.LoaderArgs) {
	const user = await prisma.user.findUnique({
		where: { username: params.username },
		select: { id: true, username: true, name: true },
	})

	// Fetch notes in parallel with user data
	const [notes, stats] = await Promise.all([
		user ? prisma.note.findMany({
			where: { ownerId: user.id },
			select: { id: true, title: true, updatedAt: true },
		}) : Promise.resolve([]),
		user ? prisma.note.count({ where: { ownerId: user.id } }) : Promise.resolve(0),
	])

	return { user, notes, stats }
}
```

**✅ Good - Nested route parallel loading:**
```typescript
// Parent route loader
// app/routes/users/$username.tsx
export async function loader({ params }: Route.LoaderArgs) {
	const user = await prisma.user.findUnique({
		where: { username: params.username },
		select: { id: true, username: true, name: true },
	})
	return { user }
}

// Child route loader runs in parallel
// app/routes/users/$username/notes.tsx
export async function loader({ params }: Route.LoaderArgs) {
	const user = await prisma.user.findUnique({
		where: { username: params.username },
		select: { id: true },
	})

	if (!user) {
		throw new Response('Not Found', { status: 404 })
	}

	const notes = await prisma.note.findMany({
		where: { ownerId: user.id },
		select: { id: true, title: true, updatedAt: true },
	})

	return { notes }
}
```

### Server-Side Rendering (SSR) Performance

React Router provides SSR by default. Optimize by:

**✅ Good - Selective data fetching:**
```typescript
export async function loader({ request }: Route.LoaderArgs) {
	// Only fetch what's needed for initial render
	const searchParams = new URL(request.url).searchParams
	const page = Number(searchParams.get('page') || '1')

	const [items, total] = await Promise.all([
		prisma.item.findMany({
			take: 20,
			skip: (page - 1) * 20,
			select: { id: true, title: true }, // Only needed fields
		}),
		prisma.item.count(),
	])

	return { items, total, page }
}
```

**✅ Good - Use caching for expensive operations:**
```typescript
import { cachified, cache } from '#app/utils/cache.server.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const timings: Timings = {}

	// Cache expensive database queries
	const stats = await cachified({
		key: 'user-stats',
		cache,
		timings,
		getFreshValue: async () => {
			return await prisma.user.aggregate({
				_count: { id: true },
			})
		},
		ttl: 1000 * 60 * 5, // 5 minutes
	})

	return { stats }
}
```

### Rendering Performance

**✅ Good - Use React.memo for expensive components:**
```typescript
import { memo } from 'react'

const ExpensiveChart = memo(function ExpensiveChart({ data }: { data: Data[] }) {
	// Expensive rendering logic
	return <Chart data={data} />
})

// Only re-renders when data changes
export default function Dashboard({ chartData }: { chartData: Data[] }) {
	return <ExpensiveChart data={chartData} />
}
```

**✅ Good - Optimize list rendering:**
```typescript
import { memo } from 'react'

const UserItem = memo(function UserItem({ user }: { user: User }) {
	return (
		<li>
			<h3>{user.name}</h3>
			<p>{user.email}</p>
		</li>
	)
}, (prev, next) => prev.user.id === next.user.id)

function UserList({ users }: { users: User[] }) {
	return (
		<ul>
			{users.map(user => (
				<UserItem key={user.id} user={user} />
			))}
		</ul>
	)
}
```

**❌ Avoid - Creating new objects/arrays in render:**
```typescript
// ❌ Don't create new objects on every render
function UserProfile({ user }: { user: User }) {
	return <Card user={{ ...user, fullName: `${user.firstName} ${user.lastName}` }} />
}

// ✅ Good - Compute in loader or memoize
export async function loader({ params }: Route.LoaderArgs) {
	const user = await prisma.user.findUnique({
		where: { username: params.username },
		select: { firstName: true, lastName: true },
	})

	return {
		user: {
			...user,
			fullName: `${user.firstName} ${user.lastName}`,
		},
	}
}
```

### Bundle Size Optimization Strategies

**✅ Good - Route-based code splitting:**
React Router automatically splits code by route. Leverage this:

```typescript
// Heavy dependencies are automatically split by route
// app/routes/admin/dashboard.tsx
import { Chart } from 'chart.js' // Only loaded on /admin/dashboard route
```

**✅ Good - Dynamic imports for heavy components:**
```typescript
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('#app/components/heavy-component.tsx'))

export default function Route() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<HeavyComponent />
		</Suspense>
	)
}
```

**✅ Good - Tree-shakeable imports:**
```typescript
// ✅ Tree-shakeable - only imports what you use
import { format } from 'date-fns/format'
import { addDays } from 'date-fns/addDays'

// ❌ Avoid - imports entire library
import * as dateFns from 'date-fns'
```

### React 18+ Features for Performance

**✅ Good - Use transitions for non-urgent updates:**
```typescript
import { useTransition } from 'react'
import { useNavigation } from 'react-router'

function SearchInput() {
	const [isPending, startTransition] = useTransition()
	const navigation = useNavigation()

	function handleSearch(query: string) {
		startTransition(() => {
			// Update search results (non-urgent)
			navigation.navigate(`/search?q=${query}`)
		})
	}

	return (
		<input
			onChange={(e) => handleSearch(e.target.value)}
			placeholder={isPending ? 'Searching...' : 'Search'}
		/>
	)
}
```

## Common mistakes to avoid

- ❌ **Fetching data in useEffect**: Use React Router loaders instead
- ❌ **Overusing useEffect**: Prefer event handlers, CSS, or ref callbacks
- ❌ **Premature memoization**: Only memoize when there's a measurable performance benefit
- ❌ **Barrel imports**: Import only what you need
- ❌ **Ignoring TypeScript types**: Use Route types for type safety
- ❌ **Not handling loading states**: Use React Router's navigation states
- ❌ **Large monolithic components**: Break components into smaller, focused pieces
- ❌ **Not using error boundaries**: Always add error boundaries to routes
- ❌ **Client-side routing when server-side works**: Prefer server-side data fetching
- ❌ **Data fetching waterfalls**: Use `Promise.all()` to fetch data in parallel
- ❌ **Fetching unnecessary data**: Only fetch what's needed for the initial render
- ❌ **Creating new objects in render**: Compute derived data in loaders or memoize
- ❌ **Not using React.memo for expensive lists**: Memoize list items for better performance
- ❌ **Not leveraging route-based code splitting**: React Router splits by route automatically

## References

- [React Router Documentation](https://reactrouter.com/)
- [React Documentation - You Might Not Need useEffect](https://react.dev/learn/you-might-not-need-an-effect)
- [Conform Documentation](https://conform.guide/)
- [Epic Stack Docs](https://www.epicweb.dev/docs)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- `app/routes/` - Example routes using these patterns
- `.cursor/rules/avoid-use-effect.mdc` - Epic Stack rule for avoiding useEffect
