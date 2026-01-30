---
name: epic-testing
description: Guide on testing with Vitest and Playwright for Epic Stack
categories:
  - testing
  - vitest
  - playwright
  - e2e
---

# Epic Stack: Testing

## When to use this skill

Use this skill when you need to:

- Write unit tests for utilities and components
- Create E2E tests with Playwright
- Test forms and validation
- Test routes and loaders
- Mock external services with MSW
- Test authentication and permissions
- Configure test database

## Patterns and conventions

### Testing Philosophy

Following Epic Web principles:

**Tests should resemble users** - Write tests that mirror how real users
interact with your application. Test user workflows, not implementation details.
If a user would click a button, your test should click that button. If a user
would see an error message, your test should check for that specific message.

**Make assertions specific** - Be explicit about what you're testing. Instead of
vague assertions, use specific, meaningful checks that clearly communicate the
expected behavior. This makes tests easier to understand and debug when they
fail.

**Example - Tests that resemble users:**

```typescript
// ✅ Good - Tests user workflow
test('User can sign up and create their first note', async ({ page, navigate }) => {
	// User visits signup page
	await navigate('/signup')

	// User fills out form like a real person would
	await page.getByRole('textbox', { name: /email/i }).fill('newuser@example.com')
	await page.getByRole('textbox', { name: /username/i }).fill('newuser')
	await page.getByRole('textbox', { name: /^password$/i }).fill('securepassword123')
	await page.getByRole('textbox', { name: /confirm/i }).fill('securepassword123')

	// User submits form
	await page.getByRole('button', { name: /sign up/i }).click()

	// User is redirected to onboarding
	await expect(page).toHaveURL(/\/onboarding/)

	// User creates their first note
	await navigate('/notes/new')
	await page.getByRole('textbox', { name: /title/i }).fill('My First Note')
	await page.getByRole('textbox', { name: /content/i }).fill('This is my first note!')
	await page.getByRole('button', { name: /create/i }).click()

	// User sees their note
	await expect(page.getByRole('heading', { name: 'My First Note' })).toBeVisible()
	await expect(page.getByText('This is my first note!')).toBeVisible()
})

// ❌ Avoid - Testing implementation details
test('Signup form calls API endpoint', async ({ page }) => {
	// This tests implementation, not user experience
	const response = await page.request.post('/signup', { data: {...} })
	expect(response.status()).toBe(200)
})
```

**Example - Specific assertions:**

```typescript
// ✅ Good - Specific assertions
test('Form shows specific validation errors', async ({ page, navigate }) => {
	await navigate('/signup')
	await page.getByRole('button', { name: /sign up/i }).click()

	// Specific error messages that users would see
	await expect(page.getByText(/email is required/i)).toBeVisible()
	await expect(
		page.getByText(/username must be at least 3 characters/i),
	).toBeVisible()
	await expect(
		page.getByText(/password must be at least 6 characters/i),
	).toBeVisible()
})

// ❌ Avoid - Vague assertions
test('Form shows errors', async ({ page, navigate }) => {
	await navigate('/signup')
	await page.getByRole('button', { name: /sign up/i }).click()

	// Too vague - what errors? where?
	expect(page.locator('.error')).toBeVisible()
})
```

### Two Types of Tests

Epic Stack uses two types of tests:

1. **Unit Tests with Vitest** - Tests for individual components and utilities
2. **E2E Tests with Playwright** - End-to-end tests of the complete flow

### Unit Tests with Vitest

**Basic setup:**

```typescript
// app/utils/my-util.test.ts
import { describe, expect, it } from 'vitest'
import { myUtil } from './my-util.ts'

describe('myUtil', () => {
	it('should do something', () => {
		expect(myUtil('input')).toBe('expected')
	})
})
```

**Testing con DOM:**

```typescript
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './my-component.tsx'

describe('MyComponent', () => {
	it('should render correctly', () => {
		render(<MyComponent />)
		expect(screen.getByText('Hello')).toBeInTheDocument()
	})
})
```

### E2E Tests with Playwright

**Basic setup:**

```typescript
// tests/e2e/my-feature.test.ts
import { expect, test } from '#tests/playwright-utils.ts'

test('Users can do something', async ({ page, navigate, login }) => {
	const user = await login()
	await navigate('/my-page')

	// Interact with the page
	await page.getByRole('button', { name: /Submit/i }).click()

	// Verificar resultado
	await expect(page).toHaveURL('/success')
})
```

### Login Fixture

Epic Stack provides a `login` fixture for authenticated tests.

**Use login fixture:**

```typescript
test('Protected route', async ({ page, navigate, login }) => {
	const user = await login() // Creates user and session automatically
	await navigate('/protected')

	// User is authenticated
	await expect(page.getByText(`Welcome ${user.username}`)).toBeVisible()
})
```

**Login with options:**

```typescript
const user = await login({
	username: 'testuser',
	email: 'test@example.com',
	password: 'password123',
})
```

**Note:** The user is automatically deleted when the test completes.

### Insert User without Login

To create user without authentication:

```typescript
test('Public content', async ({ page, navigate, insertNewUser }) => {
	const user = await insertNewUser({
		username: 'publicuser',
		email: 'public@example.com',
	})

	await navigate(`/users/${user.username}`)
	await expect(page.getByText(user.username)).toBeVisible()
})
```

### Navigate Helper

Use the `navigate` helper to navigate with type-safety:

```typescript
// Type-safe navigation
await navigate('/users/:username/notes', { username: user.username })
await navigate('/users/:username/notes/:noteId', {
	username: user.username,
	noteId: note.id,
})

// Also works with routes without parameters
await navigate('/login')
```

### Test Database

Epic Stack uses a separate test database.

**Automatic configuration:**

- The test database is configured automatically
- It's cleaned between tests
- Data created in tests is automatically deleted

**Create data in tests:**

```typescript
import { prisma } from '#app/utils/db.server.ts'

test('User can see notes', async ({ page, navigate, login }) => {
	const user = await login()

	// Create note in database
	const note = await prisma.note.create({
		data: {
			title: 'Test Note',
			content: 'Test Content',
			ownerId: user.id,
		},
	})

	await navigate('/users/:username/notes/:noteId', {
		username: user.username,
		noteId: note.id,
	})

	await expect(page.getByText('Test Note')).toBeVisible()
})
```

### MSW (Mock Service Worker)

Epic Stack uses MSW to mock external services.

**Mock example:**

```typescript
// tests/mocks/github.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
	http.get('https://api.github.com/user', () => {
		return HttpResponse.json({
			id: '123',
			login: 'testuser',
			email: 'test@example.com',
		})
	}),
]
```

**Use in tests:** Mocks are automatically applied when `MOCKS=true` is
configured.

### Testing Forms

**Test form:**

```typescript
test('User can submit form', async ({ page, navigate, login }) => {
	const user = await login()
	await navigate('/notes/new')

	// Fill form
	await page.getByRole('textbox', { name: /title/i }).fill('New Note')
	await page.getByRole('textbox', { name: /content/i }).fill('Note content')

	// Submit
	await page.getByRole('button', { name: /submit/i }).click()

	// Verificar redirect
	await expect(page).toHaveURL(new RegExp('/users/.*/notes/.*'))
})
```

**Test validation:**

```typescript
test('Form shows validation errors', async ({ page, navigate }) => {
	await navigate('/signup')

	// Submit sin llenar
	await page.getByRole('button', { name: /submit/i }).click()

	// Verificar errores
	await expect(page.getByText(/email is required/i)).toBeVisible()
})
```

### Testing Loaders

**Test loader:**

```typescript
// app/utils/my-util.test.ts
import { describe, expect, it } from 'vitest'
import { loader } from '../routes/my-route.ts'
import { prisma } from '../utils/db.server.ts'

describe('loader', () => {
	it('should load data', async () => {
		// Create data
		const user = await prisma.user.create({
			data: {
				email: 'test@example.com',
				username: 'testuser',
				roles: { connect: { name: 'user' } },
			},
		})

		// Mock request
		const request = new Request('http://localhost/my-route')

		// Execute loader
		const result = await loader({ request, params: {}, context: {} })

		// Verify result
		expect(result.data).toBeDefined()
	})
})
```

### Testing Actions

**Test action:**

```typescript
// tests/e2e/notes.test.ts
test('User can create note', async ({ page, navigate, login }) => {
	const user = await login()
	await navigate('/users/:username/notes', { username: user.username })

	await page.getByRole('link', { name: /new note/i }).click()

	const formData = new FormData()
	formData.set('title', 'Test Note')
	formData.set('content', 'Test Content')

	await page.getByRole('textbox', { name: /title/i }).fill('Test Note')
	await page.getByRole('textbox', { name: /content/i }).fill('Test Content')
	await page.getByRole('button', { name: /submit/i }).click()

	// Verify that note was created
	await expect(page.getByText('Test Note')).toBeVisible()
})
```

### Testing Permissions

**Test permissions:**

```typescript
test('Only owner can delete note', async ({
	page,
	navigate,
	login,
	insertNewUser,
}) => {
	const owner = await login()
	const otherUser = await insertNewUser()

	const note = await prisma.note.create({
		data: {
			title: 'Test Note',
			content: 'Test',
			ownerId: owner.id,
		},
	})

	// Login as other user
	const session = await createSession(otherUser.id)
	await page.context().addCookies([getCookie(session)])

	await navigate('/users/:username/notes/:noteId', {
		username: owner.username,
		noteId: note.id,
	})

	// Verify that can't delete
	await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible()
})
```

### DB Helpers

**Create user:**

```typescript
import { createUser } from '#tests/db-utils.ts'

const userData = createUser() // Generates unique random data
```

**Create password:**

```typescript
import { createPassword } from '#tests/db-utils.ts'

const password = createPassword('mypassword') // { hash: '...' }
```

### Wait For Helper

To wait for async conditions:

```typescript
import { waitFor } from '#tests/playwright-utils.ts'

await waitFor(
	async () => {
		const element = await page.getByText('Content loaded').first()
		expect(element).toBeVisible()
		return element
	},
	{ timeout: 5000, errorMessage: 'Content never loaded' },
)
```

### Testing GitHub OAuth

**Prepare GitHub user:**

```typescript
test('User can login with GitHub', async ({
	page,
	navigate,
	prepareGitHubUser,
}) => {
	const ghUser = await prepareGitHubUser()

	await navigate('/login')
	await page.getByRole('link', { name: /github/i }).click()

	// GitHub user is automatically prepared
	await expect(page).toHaveURL('/onboarding/github')
})
```

## Common examples

### Example 1: Complete E2E test (resembling user workflow)

```typescript
// tests/e2e/notes.test.ts
import { expect, test } from '#tests/playwright-utils.ts'
import { prisma } from '#app/utils/db.server.ts'
import { faker } from '@faker-js/faker'

test('Users can create, edit, and delete notes', async ({
	page,
	navigate,
	login,
}) => {
	// User logs in (realistic workflow)
	const user = await login()
	await navigate('/users/:username/notes', { username: user.username })

	// User creates a new note (clicking link, filling form, submitting)
	await page.getByRole('link', { name: /new note/i }).click()
	const newNote = {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(2),
	}
	await page.getByRole('textbox', { name: /title/i }).fill(newNote.title)
	await page.getByRole('textbox', { name: /content/i }).fill(newNote.content)
	await page.getByRole('button', { name: /submit/i }).click()

	// Specific assertions: user sees their note with correct title and content
	await expect(page.getByRole('heading', { name: newNote.title })).toBeVisible()
	await expect(page.getByText(newNote.content)).toBeVisible()
	const noteUrl = page.url()
	const noteId = noteUrl.split('/').pop()

	// User edits the note (clicking edit, updating fields, saving)
	await page.getByRole('link', { name: /edit/i }).click()
	const updatedNote = {
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(2),
	}
	await page.getByRole('textbox', { name: /title/i }).fill(updatedNote.title)
	await page
		.getByRole('textbox', { name: /content/i })
		.fill(updatedNote.content)
	await page.getByRole('button', { name: /submit/i }).click()

	// Specific assertions: user sees updated content
	await expect(
		page.getByRole('heading', { name: updatedNote.title }),
	).toBeVisible()
	await expect(page.getByText(updatedNote.content)).toBeVisible()

	// User deletes the note (clicking delete button)
	await page.getByRole('button', { name: /delete/i }).click()

	// Specific assertion: user is redirected back to notes list
	await expect(page).toHaveURL(`/users/${user.username}/notes`)
	await expect(page.getByText(updatedNote.title)).not.toBeVisible()
})
```

### Example 2: Unit test for utility

```typescript
// app/utils/misc.test.ts
import { describe, expect, it } from 'vitest'
import { cn } from './misc.tsx'

describe('cn', () => {
	it('should merge class names', () => {
		expect(cn('foo', 'bar')).toBe('foo bar')
		expect(cn('foo', undefined, 'bar')).toBe('foo bar')
		expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
	})
})
```

### Example 3: Form validation test

```typescript
// tests/e2e/signup.test.ts
test('Signup form validation', async ({ page, navigate }) => {
	await navigate('/signup')

	// Submit without filling
	await page.getByRole('button', { name: /submit/i }).click()

	// Verify errors
	await expect(page.getByText(/email is required/i)).toBeVisible()

	// Fill invalid email
	await page.getByRole('textbox', { name: /email/i }).fill('invalid')
	await page.getByRole('button', { name: /submit/i }).click()

	// Verify email error
	await expect(page.getByText(/email is invalid/i)).toBeVisible()

	// Fill valid email
	await page.getByRole('textbox', { name: /email/i }).fill('test@example.com')
	await page.getByRole('button', { name: /submit/i }).click()

	// Verify redirect to onboarding
	await expect(page).toHaveURL(/\/onboarding/)
})
```

### Example 4: Permissions test

```typescript
// tests/e2e/permissions.test.ts
test('Only admin can access admin routes', async ({
	page,
	navigate,
	login,
	insertNewUser,
}) => {
	// Test with normal user
	const normalUser = await login()

	await navigate('/admin/users')

	// Should redirect or show error
	await expect(page).toHaveURL('/') // Or verify error message

	// Test with admin
	await page.context().clearCookies()
	const admin = await insertNewUser()
	await prisma.user.update({
		where: { id: admin.id },
		data: {
			roles: {
				connect: { name: 'admin' },
			},
		},
	})

	// Login as admin
	const adminSession = await createSession(admin.id)
	await page.context().addCookies([getCookie(adminSession)])

	await navigate('/admin/users')

	// Now should work
	await expect(page.getByText('All Users')).toBeVisible()
})
```

## Common mistakes to avoid

- ❌ **Testing implementation details instead of user workflows**: Write tests
  that mirror how users actually use your app
- ❌ **Vague assertions**: Use specific, meaningful assertions that clearly
  communicate expected behavior
- ❌ **Not cleaning data after tests**: Epic Stack cleans automatically, but
  make sure not to depend on data between tests
- ❌ **Assuming execution order**: Tests must be independent
- ❌ **Not using fixtures**: Use `login`, `insertNewUser`, etc. instead of
  creating everything manually
- ❌ **Hardcoding data**: Use `faker` to generate unique data
- ❌ **Not waiting for elements**: Use `expect` with `toBeVisible()` instead of
  assuming it exists
- ❌ **Not using type-safe navigation**: Use `navigate` helper instead of
  `page.goto()` directly
- ❌ **Forgetting MSW in tests**: External services are automatically mocked
  when `MOCKS=true`
- ❌ **Not testing error cases**: Test both happy path and errors
- ❌ **Testing internal state instead of user-visible behavior**: Focus on what
  users see and do

## References

- [Epic Stack Testing Docs](../epic-stack/docs/testing.md)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW](https://mswjs.io/)
- `tests/playwright-utils.ts` - Playwright fixtures and helpers
- `tests/db-utils.ts` - DB helpers for tests
- `tests/e2e/` - E2E test examples
- `app/utils/*.test.ts` - Unit test examples
