---
name: epic-security
description:
  Guide on security practices including CSP, rate limiting, and session security
  for Epic Stack
categories:
  - security
  - csp
  - rate-limiting
  - headers
---

# Epic Stack: Security

## When to use this skill

Use this skill when you need to:

- Configure Content Security Policy (CSP)
- Implement spam protection (honeypot)
- Configure rate limiting
- Manage session security
- Implement input validation
- Configure secure headers
- Manage secrets

## Patterns and conventions

### Security Philosophy

Following Epic Web principles:

**Design to fail fast and early** - Validate security constraints as early as
possible. Check authentication, authorization, and input validation before
processing requests. Fail immediately with clear error messages rather than
allowing potentially malicious data to flow through the system.

**Optimize for the debugging experience** - When security checks fail, provide
clear, actionable error messages that help developers understand what went
wrong. Log security events with enough context to debug issues without exposing
sensitive information.

**Example - Fail fast validation:**

```typescript
// ✅ Good - Validate security constraints early
export async function action({ request }: Route.ActionArgs) {
	// 1. Authenticate immediately - fail fast if not authenticated
	const userId = await requireUserId(request)

	// 2. Validate input early - fail fast if invalid
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: NoteSchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply() }, { status: 400 })
	}

	// 3. Check permissions early - fail fast if unauthorized
	await requireUserWithPermission(request, 'create:note:own')

	// Only proceed if all security checks pass
	const { title, content } = submission.value
	// ... create note
}

// ❌ Avoid - Security checks scattered or delayed
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	// ... process data first

	// Security check at the end - too late!
	const userId = await getUserId(request)
	if (!userId) {
		// Already processed potentially malicious data
		return json({ error: 'Unauthorized' }, { status: 401 })
	}
}
```

**Example - Debugging-friendly error messages:**

```typescript
// ✅ Good - Clear error messages for debugging
export async function checkHoneypot(formData: FormData) {
	try {
		await honeypot.check(formData)
	} catch (error) {
		if (error instanceof SpamError) {
			// Log with context for debugging
			console.error('Honeypot triggered', {
				timestamp: new Date().toISOString(),
				userAgent: formData.get('user-agent'),
				// Don't log sensitive data
			})
			throw new Response('Form not submitted properly', { status: 400 })
		}
		throw error
	}
}

// ❌ Avoid - Generic or unhelpful errors
export async function checkHoneypot(formData: FormData) {
	try {
		await honeypot.check(formData)
	} catch (error) {
		// No context, hard to debug
		throw new Response('Error', { status: 400 })
	}
}
```

### Content Security Policy (CSP)

Epic Stack uses CSP to prevent XSS and other attacks.

**Configuration in `server/index.ts`:**

```typescript
import { helmet } from '@nichtsam/helmet/node-http'

app.use((_, res, next) => {
	helmet(res, { general: { referrerPolicy: false } })
	next()
})
```

**Note:** By default, CSP is in `report-only` mode to avoid blocking resources
during development. In production, remove `reportOnly: true` to enable it fully.

### Honeypot Fields

Epic Stack uses honeypot fields to protect against spam bots.

**En formularios públicos:**

```typescript
import { HoneypotInputs } from 'remix-utils/honeypot/react'

<Form method="POST" {...getFormProps(form)}>
	<HoneypotInputs /> {/* Always include in public forms */}
	{/* Resto de campos */}
</Form>
```

**En el action (fail fast):**

```typescript
import { checkHoneypot } from '#app/utils/honeypot.server.ts'

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	// Check honeypot first - fail fast if spam detected
	await checkHoneypot(formData) // Lanza error si es spam

	// Only proceed if honeypot check passes
	// ... resto del código
}
```

**Configuration:**

```typescript
// app/utils/honeypot.server.ts
import { Honeypot, SpamError } from 'remix-utils/honeypot/server'

export const honeypot = new Honeypot({
	validFromFieldName: process.env.NODE_ENV === 'test' ? null : undefined,
	encryptionSeed: process.env.HONEYPOT_SECRET,
})

export async function checkHoneypot(formData: FormData) {
	try {
		await honeypot.check(formData)
	} catch (error) {
		if (error instanceof SpamError) {
			// Log for debugging (without sensitive data)
			console.error('Honeypot triggered', {
				timestamp: new Date().toISOString(),
			})
			throw new Response('Form not submitted properly', { status: 400 })
		}
		throw error
	}
}
```

### Rate Limiting

Epic Stack uses `express-rate-limit` para prevenir abuso.

**Basic configuration:**

```typescript
// server/index.ts
import rateLimit from 'express-rate-limit'

const rateLimitDefault = {
	windowMs: 60 * 1000, // 1 minute
	limit: 1000, // 1000 requests per minute
	standardHeaders: true,
	legacyHeaders: false,
	validate: { trustProxy: false },
	keyGenerator: (req: express.Request) => {
		return req.get('fly-client-ip') ?? `${req.ip}`
	},
}

const generalRateLimit = rateLimit(rateLimitDefault)
```

**Different levels of rate limiting:**

```typescript
// Stricter rate limit for sensitive routes
const strongestRateLimit = rateLimit({
	...rateLimitDefault,
	limit: 10, // Only 10 requests per minute
})

// Strong rate limit for important actions
const strongRateLimit = rateLimit({
	...rateLimitDefault,
	limit: 100, // 100 requests per minute
})
```

**Apply to specific routes:**

```typescript
app.use((req, res, next) => {
	const strongPaths = [
		'/login',
		'/signup',
		'/verify',
		'/admin',
		'/reset-password',
	]

	if (req.method !== 'GET' && req.method !== 'HEAD') {
		if (strongPaths.some((p) => req.path.includes(p))) {
			return strongestRateLimit(req, res, next)
		}
		return strongRateLimit(req, res, next)
	}

	return generalRateLimit(req, res, next)
})
```

**Note:** In tests and development, rate limiting is effectively disabled to
allow fast tests.

### Session Security

**Secure session configuration:**

```typescript
// app/utils/session.server.ts
export const authSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_session',
		sameSite: 'lax', // CSRF protection advised if changing to 'none'
		path: '/',
		httpOnly: true, // Prevents access from JavaScript
		secrets: process.env.SESSION_SECRET.split(','), // Secret rotation
		secure: process.env.NODE_ENV === 'production', // HTTPS only in production
	},
})
```

**Security features:**

- `httpOnly: true` - Prevents access from JavaScript (XSS protection)
- `secure: true` - Only sends cookies over HTTPS in production
- `sameSite: 'lax'` - CSRF protection
- Secret rotation using array

### Password Security

**Hashing de passwords:**

```typescript
import bcrypt from 'bcryptjs'

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10) // 10 rounds
	return hash
}

export async function verifyUserPassword(
	where: Pick<User, 'username'> | Pick<User, 'id'>,
	password: string,
) {
	const userWithPassword = await prisma.user.findUnique({
		where,
		select: { id: true, password: { select: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash)
	return isValid ? { id: userWithPassword.id } : null
}
```

**Check common passwords (Have I Been Pwned):**

```typescript
import { checkIsCommonPassword } from '#app/utils/auth.server.ts'

const isCommonPassword = await checkIsCommonPassword(password)
if (isCommonPassword) {
	ctx.addIssue({
		path: ['password'],
		code: 'custom',
		message: 'Password is too common',
	})
}
```

### Input Validation y Sanitization

**Always validate inputs with Zod:**

```typescript
import { z } from 'zod'

const UserSchema = z.object({
	email: z
		.string()
		.email()
		.min(3)
		.max(100)
		.transform((val) => val.toLowerCase()),
	username: z
		.string()
		.min(3)
		.max(20)
		.regex(/^[a-zA-Z0-9_]+$/),
	password: z.string().min(6).max(72), // bcrypt limit
})

// Validate before using
const result = UserSchema.safeParse(data)
if (!result.success) {
	return json({ errors: result.error.flatten() }, { status: 400 })
}
```

**Sanitization:**

- Use `.transform()` from Zod to sanitize data
- Normalize emails to lowercase
- Normalize usernames to lowercase
- Clean whitespace

### XSS Prevention

React prevents XSS automatically by escaping all values.

**Never use `dangerouslySetInnerHTML` with user data:**

```typescript
// ❌ NEVER do this with user data
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ React escapa automáticamente
<div>{userContent}</div>
```

### Secure Headers

Epic Stack uses Helmet for secure headers.

**Configuration:**

```typescript
import { helmet } from '@nichtsam/helmet/node-http'

app.use((_, res, next) => {
	helmet(res, { general: { referrerPolicy: false } })
	next()
})
```

**Included headers:**

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy (configurable)

### HTTPS Only

**Redirect HTTP to HTTPS:**

```typescript
app.use((req, res, next) => {
	if (req.method !== 'GET') return next()
	const proto = req.get('X-Forwarded-Proto')
	const host = getHost(req)
	if (proto === 'http') {
		res.set('X-Forwarded-Proto', 'https')
		res.redirect(`https://${host}${req.originalUrl}`)
		return
	}
	next()
})
```

### Secrets Management

**Variables de entorno:**

```bash
# .env
SESSION_SECRET=secret1,secret2,secret3 # Secret rotation
HONEYPOT_SECRET=your-honeypot-secret
DATABASE_URL=file:./data/db.sqlite
```

**En Fly.io:**

```bash
fly secrets set SESSION_SECRET="secret1,secret2,secret3"
fly secrets set HONEYPOT_SECRET="your-secret"
```

**Never commit secrets:**

- Use `.env.example` to document required variables
- `.env` is in `.gitignore`
- Use `fly secrets` for production

### Validación de Session Expiration (Fail Fast)

**Always verify expiration early:**

```typescript
export async function getUserId(request: Request) {
	const authSession = await authSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const sessionId = authSession.get(sessionKey)

	// Fail fast - return null immediately if no session
	if (!sessionId) return null

	// Verify expiration early - fail fast if expired
	const session = await prisma.session.findUnique({
		select: { userId: true },
		where: {
			id: sessionId,
			expirationDate: { gt: new Date() }, // Verify expiration
		},
	})

	// Fail fast - destroy invalid session immediately
	if (!session?.userId) {
		throw redirect('/', {
			headers: {
				'set-cookie': await authSessionStorage.destroySession(authSession),
			},
		})
	}
	return session.userId
}
```

## Common examples

### Example 1: Public form with honeypot

```typescript
// app/routes/_auth/signup.tsx
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	await checkHoneypot(formData) // Spam protection

	const submission = await parseWithZod(formData, {
		schema: SignupSchema,
	})

	// ... rest of code
}

export default function SignupRoute({ actionData }: Route.ComponentProps) {
	return (
		<Form method="POST" {...getFormProps(form)}>
			<HoneypotInputs /> {/* Include in form */}
			{/* Rest of fields */}
		</Form>
	)
}
```

### Example 2: Custom rate limiting

```typescript
// server/index.ts
const apiRateLimit = rateLimit({
	...rateLimitDefault,
	windowMs: 60 * 1000,
	limit: 100, // 100 requests per minute for API
	keyGenerator: (req) => {
		const apiKey = req.get('X-API-Key')
		return apiKey ?? req.get('fly-client-ip') ?? req.ip
	},
})

app.use('/api', apiRateLimit)
```

### Example 3: Strict input validation

```typescript
// app/utils/user-validation.ts
import { z } from 'zod'

export const EmailSchema = z
	.string({ required_error: 'Email is required' })
	.email({ message: 'Email is invalid' })
	.min(3, { message: 'Email is too short' })
	.max(100, { message: 'Email is too long' })
	.transform((value) => value.toLowerCase().trim()) // Sanitization

export const UsernameSchema = z
	.string({ required_error: 'Username is required' })
	.min(3, { message: 'Username is too short' })
	.max(20, { message: 'Username is too long' })
	.regex(/^[a-zA-Z0-9_]+$/, {
		message: 'Username can only include letters, numbers, and underscores',
	})
	.transform((value) => value.toLowerCase().trim()) // Sanitization

export const PasswordSchema = z
	.string({ required_error: 'Password is required' })
	.min(6, { message: 'Password is too short' })
	.refine((val) => new TextEncoder().encode(val).length <= 72, {
		message: 'Password is too long', // bcrypt limit
	})
```

### Example 4: Permission verification before actions

```typescript
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)

	// Validate that user has permission
	await requireUserWithPermission(request, 'delete:note:own')

	// Only after validating permissions
	await prisma.note.delete({ where: { id: noteId } })

	return redirect('/notes')
}
```

## Common mistakes to avoid

- ❌ **Delayed security checks**: Validate authentication, authorization, and
  input as early as possible - fail fast
- ❌ **Generic error messages**: Provide clear, actionable error messages that
  help with debugging (without exposing sensitive data)
- ❌ **Forgetting honeypot in public forms**: Always include `HoneypotInputs` in
  forms accessible without authentication
- ❌ **Not validating session expiration**: Always verify `expirationDate` when
  getting sessions - check early
- ❌ **Using `dangerouslySetInnerHTML` with user data**: Never render user HTML
  without sanitizing
- ❌ **Not using rate limiting**: Protect sensitive routes with rate limiting
- ❌ **Secrets in code**: Never hardcode secrets, use environment variables
- ❌ **Not sanitizing inputs**: Always sanitize inputs with `.transform()` from
  Zod
- ❌ **Not validating common passwords**: Check passwords against Have I Been
  Pwned
- ❌ **Sessions without httpOnly**: Always use `httpOnly: true` in session
  cookies
- ❌ **Not using HTTPS in production**: Make sure to redirect HTTP to HTTPS
- ❌ **CSP too permissive**: Review and adjust CSP according to your needs
- ❌ **Not logging security events**: Log security failures with context for
  debugging (without sensitive data)

## References

- [Epic Stack Security Docs](../epic-stack/docs/security.md)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- `app/utils/honeypot.server.ts` - Honeypot implementation
- `server/index.ts` - Server security configuration
- `docs/decisions/033-honeypot.md` - Honeypot documentation
- `docs/decisions/025-rate-limiting.md` - Rate limiting documentation
- `docs/decisions/008-content-security-policy.md` - CSP documentation
