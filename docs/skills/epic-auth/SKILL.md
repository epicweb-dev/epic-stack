---
name: epic-auth
description:
  Guide on authentication, sessions, OAuth, 2FA, and passkeys for Epic Stack
categories:
  - authentication
  - sessions
  - oauth
  - security
---

# Epic Stack: Authentication

## When to use this skill

Use this skill when you need to:

- Implement user authentication
- Work with sessions and cookies
- Configure OAuth providers (GitHub, Google, etc.)
- Implement 2FA (Two-Factor Authentication)
- Implement WebAuthn/Passkeys
- Handle login, signup, logout flows
- Manage email verification
- Implement password reset

## Patterns and conventions

### Authentication Philosophy

Following Epic Web principles:

**Least privilege** - Users should only have access to what they need, when they
need it. Sessions should have minimal permissions and expire appropriately.
Don't grant more access than necessary.

**Design to fail fast and early** - Validate authentication and authorization as
early as possible. Check session validity immediately, verify permissions before
processing requests, and return clear errors quickly.

**Example - Least privilege in sessions:**

```typescript
// ✅ Good - Minimal session data, explicit permissions
const session = await prisma.session.create({
	data: {
		expirationDate: getSessionExpirationDate(),
		userId, // Only store user ID, not full user data
	},
})

// Session only grants access to this specific user
// Permissions checked separately when needed

// ❌ Avoid - Storing too much in session
const session = await prisma.session.create({
	data: {
		expirationDate: getSessionExpirationDate(),
		userId,
		userRole: 'admin', // Don't store roles in session
		permissions: ['all'], // Don't store permissions in session
	},
})
// Roles and permissions should be checked from database, not session
```

**Example - Fail fast authentication:**

```typescript
// ✅ Good - Validate authentication early
export async function loader({ request }: Route.LoaderArgs) {
	// Check authentication immediately - fail fast
	const userId = await requireUserId(request)

	// Check permissions early - fail fast
	await requireUserWithPermission(request, 'read:note:own')

	// Only proceed if authenticated and authorized
	const notes = await prisma.note.findMany({
		where: { ownerId: userId },
	})

	return { notes }
}

// ❌ Avoid - Delayed authentication check
export async function loader({ request }: Route.LoaderArgs) {
	// Process request first...
	const notes = await prisma.note.findMany()

	// Check authentication at the end - too late!
	const userId = await getUserId(request)
	if (!userId) {
		// Already processed request
		throw redirect('/login')
	}
}
```

### Cookie-based Sessions

Epic Stack uses cookie-based sessions for authentication. Sessions are stored in
the database and identified by signed cookies.

**Session configuration:**

```typescript
// app/utils/session.server.ts
import { createCookieSessionStorage } from 'react-router'

export const authSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_session',
		sameSite: 'lax', // CSRF protection advised if changing to 'none'
		path: '/',
		httpOnly: true,
		secrets: process.env.SESSION_SECRET.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
})
```

### Get current user

**Server-side:**

```typescript
import { getUserId, requireUserId } from '#app/utils/auth.server.ts'

// Get userId or null if not authenticated
const userId = await getUserId(request)

// Require authenticated user (redirects to /login if not)
const userId = await requireUserId(request)
const userId = await requireUserId(request, { redirectTo: '/custom-login' })

// Require that user is NOT authenticated
import { requireAnonymous } from '#app/utils/auth.server.ts'
await requireAnonymous(request) // Redirects to / if authenticated
```

**Client-side:**

```typescript
import { useOptionalUser, useUser } from '#app/utils/user.ts'

// Get user or undefined if not authenticated
const user = useOptionalUser()

// Get authenticated user (throws error if not)
const user = useUser()
```

### Login with Email/Password

**Validation schema:**

```typescript
const LoginSchema = z.object({
	username: UsernameSchema,
	password: z.string().min(1, 'Password is required'),
	redirectTo: z.string().optional(),
	remember: z.boolean().optional(),
})
```

**Login action (fail fast):**

```typescript
import { login } from '#app/utils/auth.server.ts'
import { handleNewSession } from './login.server.ts'

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	// Validate input early - fail fast
	const submission = await parseWithZod(formData, {
		schema: LoginSchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply() }, { status: 400 })
	}

	const { username, password, redirectTo, remember } = submission.value

	// Authenticate early - fail fast if invalid
	const session = await login({ username, password })

	if (!session) {
		// Return error immediately - don't process further
		return data(
			{
				result: submission.reply({
					formErrors: ['Invalid username or password'],
				}),
			},
			{ status: 400 },
		)
	}

	// Only create session if authentication succeeded
	return handleNewSession({
		request,
		session,
		redirectTo,
		remember: remember ?? false,
	})
}
```

### Signup with Email/Password

**Signup action:**

```typescript
import { signup } from '#app/utils/auth.server.ts'

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	// Validate form...

	const session = await signup({
		email,
		username,
		password,
		name,
	})

	// Handle session and redirect...
}
```

### OAuth Providers (GitHub, Google, etc.)

Epic Stack uses `remix-auth` for OAuth providers.

**Configure provider (GitHub example):**

```typescript
// app/utils/providers/github.server.ts
import { GitHubStrategy } from 'remix-auth-github'

export class GitHubProvider implements AuthProvider {
	getAuthStrategy() {
		return new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				callbackURL: '/auth/github/callback',
			},
			async ({ profile }) => {
				// Return user profile
				return {
					id: profile.id,
					email: profile.emails[0].value,
					username: profile.displayName,
					name: profile.displayName,
				}
			},
		)
	}
}
```

**Callback handler:**

```typescript
// app/routes/_auth/auth.$provider/callback.ts
export async function loader({ request, params }: Route.LoaderArgs) {
	const providerName = ProviderNameSchema.parse(params.provider)
	const authResult = await authenticator.authenticate(providerName, request)

	if (!authResult.success) {
		throw redirectWithToast('/login', {
			title: 'Auth Failed',
			description: `Error authenticating with ${providerName}`,
			type: 'error',
		})
	}

	const { data: profile } = authResult

	// Check if connection exists
	const existingConnection = await prisma.connection.findUnique({
		where: {
			providerName_providerId: {
				providerName,
				providerId: String(profile.id),
			},
		},
	})

	// If exists, create session
	if (existingConnection) {
		return makeSession({ request, userId: existingConnection.userId })
	}

	// If email exists, link account
	const user = await prisma.user.findUnique({
		where: { email: profile.email.toLowerCase() },
	})
	if (user) {
		await prisma.connection.create({
			data: {
				providerName,
				providerId: String(profile.id),
				userId: user.id,
			},
		})
		return makeSession({ request, userId: user.id })
	}

	// New user, go to onboarding
	// ...
}
```

### WebAuthn/Passkeys

Epic Stack supports authentication with passkeys using WebAuthn.

**Loader to generate options:**

```typescript
// app/routes/_auth/webauthn/authentication.ts
import { generateAuthenticationOptions } from '@simplewebauthn/server'

export async function loader({ request }: Route.LoaderArgs) {
	const config = getWebAuthnConfig(request)
	const options = await generateAuthenticationOptions({
		rpID: config.rpID,
		userVerification: 'preferred',
	})

	const cookieHeader = await passkeyCookie.serialize({
		challenge: options.challenge,
	})

	return Response.json(
		{ options },
		{
			headers: { 'Set-Cookie': cookieHeader },
		},
	)
}
```

**Action to verify authentication:**

```typescript
import { verifyAuthenticationResponse } from '@simplewebauthn/server'

export async function action({ request }: Route.ActionArgs) {
	const cookie = await passkeyCookie.parse(request.headers.get('Cookie'))

	if (!cookie?.challenge) {
		throw new Error('Authentication challenge not found')
	}

	const { authResponse } = await request.json()
	const passkey = await prisma.passkey.findUnique({
		where: { id: authResponse.id },
		include: { user: true },
	})

	const verification = await verifyAuthenticationResponse({
		response: authResponse,
		expectedChallenge: cookie.challenge,
		expectedOrigin: config.origin,
		expectedRPID: config.rpID,
		credential: {
			id: authResponse.id,
			publicKey: passkey.publicKey,
			counter: Number(passkey.counter),
		},
	})

	if (!verification.verified) {
		throw new Error('Authentication verification failed')
	}

	// Actualizar counter
	await prisma.passkey.update({
		where: { id: passkey.id },
		data: { counter: BigInt(verification.authenticationInfo.newCounter) },
	})

	// Create sesión
	const session = await prisma.session.create({
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: passkey.userId,
		},
	})

	return handleNewSession({ request, session, remember: true })
}
```

### Two-Factor Authentication (2FA) with TOTP

Epic Stack uses TOTP (Time-based One-Time Password) para 2FA.

**Check if user has 2FA:**

```typescript
const verification = await prisma.verification.findUnique({
	where: {
		target_type: {
			target: session.userId,
			type: twoFAVerificationType,
		},
	},
})
const userHasTwoFactor = Boolean(verification)
```

**Handle session with 2FA:**

```typescript
export async function handleNewSession({
	request,
	session,
	redirectTo,
	remember,
}: {
	request: Request
	session: { userId: string; id: string; expirationDate: Date }
	redirectTo?: string
	remember: boolean
}) {
	const verification = await prisma.verification.findUnique({
		where: {
			target_type: {
				target: session.userId,
				type: twoFAVerificationType,
			},
		},
	})
	const userHasTwoFactor = Boolean(verification)

	if (userHasTwoFactor) {
		// Save unverified session
		const verifySession = await verifySessionStorage.getSession()
		verifySession.set(unverifiedSessionIdKey, session.id)
		verifySession.set(rememberKey, remember)

		// Redirect to 2FA verification
		const redirectUrl = getRedirectToUrl({
			request,
			type: twoFAVerificationType,
			target: session.userId,
			redirectTo,
		})
		return redirect(redirectUrl.toString(), {
			headers: {
				'set-cookie': await verifySessionStorage.commitSession(verifySession),
			},
		})
	} else {
		// User without 2FA, create session directly
		const authSession = await authSessionStorage.getSession(
			request.headers.get('cookie'),
		)
		authSession.set(sessionKey, session.id)
		return redirect(safeRedirect(redirectTo), {
			headers: {
				'set-cookie': await authSessionStorage.commitSession(authSession, {
					expires: remember ? session.expirationDate : undefined,
				}),
			},
		})
	}
}
```

**Verify 2FA code:**

```typescript
import { prepareTOTP, verifyTOTP } from '@epic-web/totp'

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: VerifySchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply() }, { status: 400 })
	}

	const { code } = submission.value
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const target = verifySession.get(targetKey)
	const type = verifySession.get(typeKey)

	if (!target || !type) {
		throw redirect('/login')
	}

	const verification = await prisma.verification.findUnique({
		where: { target_type: { target, type } },
		select: {
			secret: true,
			algorithm: true,
			period: true,
			digits: true,
		},
	})

	if (!verification) {
		throw redirect('/login')
	}

	const isValid = verifyTOTP({
		otp: code,
		secret: verification.secret,
		algorithm: verification.algorithm as any,
		period: verification.period,
		digits: verification.digits,
	})

	if (!isValid) {
		return data(
			{
				result: submission.reply({
					formErrors: ['Invalid code'],
				}),
			},
			{ status: 400 },
		)
	}

	// Verify session and complete login
	return handleVerification({ request, submission })
}
```

### Email Verification

Epic Stack uses TOTP codes sent via email for verification.

**Prepare verification:**

```typescript
import { prepareVerification } from './verify.server.ts'

const { verifyUrl, redirectTo, otp } = await prepareVerification({
	period: 10 * 60, // 10 minutes
	request,
	type: 'onboarding',
	target: email,
})

// Enviar email con código y URL
await sendEmail({
	to: email,
	subject: 'Welcome!',
	react: <VerificationEmail verifyUrl={verifyUrl.toString()} otp={otp} />,
})

return redirect(redirectTo.toString())
```

**Verify code:**

```typescript
export async function loader({ request }: Route.LoaderArgs) {
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const target = verifySession.get(targetKey)
	const type = verifySession.get(typeKey)

	if (!target || !type) {
		throw redirect('/signup')
	}

	return { target, type }
}

export async function action({ request }: Route.ActionArgs) {
	// Verify code (similar to 2FA)
	// ...
}
```

### Password Reset

**Request reset:**

```typescript
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: ForgotPasswordSchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply() }, { status: 400 })
	}

	const { email } = submission.value

	// Prepare verification
	const { verifyUrl, redirectTo, otp } = await prepareVerification({
		period: 10 * 60,
		request,
		type: 'reset-password',
		target: email,
	})

	// Enviar email con código y URL
	await sendEmail({
		to: email,
		subject: 'Reset your password',
		react: <ResetPasswordEmail verifyUrl={verifyUrl.toString()} otp={otp} />,
	})

	return redirect(redirectTo.toString())
}
```

**Reset password:**

```typescript
export async function action({ request }: Route.ActionArgs) {
	// Verify code first (similar to email verification)
	// Then reset password

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: ResetPasswordSchema,
	})

	// Verify that code is valid
	// ...

	const { password } = submission.value

	await resetUserPassword({
		username,
		password,
	})

	// Destroy verification session and redirect to login
	// ...
}
```

### Logout

```typescript
import { logout } from '#app/utils/auth.server.ts'

export async function action({ request }: Route.ActionArgs) {
	return logout({ request, redirectTo: '/' })
}
```

### Session Management

**Create session:**

```typescript
const session = await prisma.session.create({
	data: {
		expirationDate: getSessionExpirationDate(),
		userId,
	},
	select: { id: true, expirationDate: true },
})
```

**Session expiration:**

```typescript
export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30 // 30 days

export const getSessionExpirationDate = () =>
	new Date(Date.now() + SESSION_EXPIRATION_TIME)
```

**Destroy session:**

```typescript
await prisma.session.deleteMany({ where: { id: sessionId } })
```

**Destroy all user sessions:**

```typescript
await prisma.session.deleteMany({ where: { userId } })
```

## Common examples

### Example 1: Complete login

```typescript
// app/routes/_auth/login.tsx
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	await checkHoneypot(formData)

	const submission = await parseWithZod(formData, {
		schema: LoginSchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply() }, { status: 400 })
	}

	const { username, password, redirectTo, remember } = submission.value

	const session = await login({ username, password })

	if (!session) {
		return data(
			{
				result: submission.reply({
					formErrors: ['Invalid username or password'],
				}),
			},
			{ status: 400 },
		)
	}

	return handleNewSession({
		request,
		session,
		redirectTo,
		remember: remember ?? false,
	})
}
```

### Example 2: Protect route

```typescript
// app/routes/protected.tsx
export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	const data = await prisma.something.findMany({
		where: { userId },
	})

	return { data }
}

export default function ProtectedRoute({ loaderData }: Route.ComponentProps) {
	return <div>{/* Datos protegidos */}</div>
}
```

### Example 3: Route only for unauthenticated users

```typescript
// app/routes/_auth/signup.tsx
export async function loader({ request }: Route.LoaderArgs) {
	await requireAnonymous(request)
	return null
}
```

## Common mistakes to avoid

- ❌ **Delayed authentication checks**: Validate authentication and
  authorization as early as possible - fail fast
- ❌ **Granting excessive privileges**: Follow least privilege - only grant
  access to what's needed, when it's needed
- ❌ **Storing too much in sessions**: Store minimal data in sessions (just user
  ID), check permissions from database
- ❌ **Not verifying session on each request**: Always use `getUserId` or
  `requireUserId` in protected loaders/actions
- ❌ **Not handling 2FA correctly**: Verify if user has 2FA before creating
  session
- ❌ **Not destroying expired sessions**: Sessions must be verified against
  `expirationDate` - check early
- ❌ **Not using `handleNewSession`**: This helper correctly handles 2FA and
  cookie creation
- ❌ **Forgetting to handle `remember`**: Make sure to respect user preference
- ❌ **Not validating OAuth callbacks**: Always validate that provider exists
  and result is successful - fail fast
- ❌ **Not linking OAuth accounts**: If email exists, link the account instead
  of creating duplicate
- ❌ **Not updating counter in passkeys**: Always update counter after
  successful verification

## References

- [Epic Stack Authentication Docs](../epic-stack/docs/authentication.md)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- [Remix Auth](https://github.com/sergiodxa/remix-auth)
- [SimpleWebAuthn](https://simplewebauthn.dev/)
- `app/utils/auth.server.ts` - Authentication utilities
- `app/utils/session.server.ts` - Gestión de sesiones
- `app/routes/_auth/login.server.ts` - Helpers de login
- `app/routes/_auth/auth.$provider/callback.ts` - OAuth callback
- `app/routes/_auth/webauthn/` - WebAuthn implementation
