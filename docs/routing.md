# Routing

The Epic Stack uses file-based routing with React Router. However, it's not
using the built-in routing convention of React Router and instead is using
[react-router-auto-routes](https://github.com/kenn/react-router-auto-routes)
which is a special implementation of the React Router convention that adds a few
features. You'll find it configured for the application in the `app/routes.ts`
file at the root of the app.

We'll defer to the `react-router-auto-routes` documentation for specifics, but
an important thing for you to know as you get used to this convention is you can
always run `npx react-router routes` from the root of the app and it will output
the routes of your application in a JSX-like output that will reveal the routes
that will be generated based on your current file structure. Here's an example
of the Epic Stack routes at the time of this writing:

```
app/routes
├── $.tsx
├── me.tsx
├── _auth
│   ├── forgot-password.tsx
│   ├── login.tsx
│   ├── logout.tsx
│   ├── reset-password.tsx
│   ├── signup.tsx
│   ├── verify.tsx
│   ├── auth.$provider
│   │   ├── callback.ts
│   │   └── index.ts
│   ├── onboarding
│   │   ├── $provider.tsx
│   │   └── index.tsx
│   └── webauthn
│       ├── authentication.ts
│       └── registration.ts
├── _marketing
│   ├── about.tsx
│   ├── index.tsx
│   ├── privacy.tsx
│   ├── support.tsx
│   ├── tos.tsx
│   └── +logos
│       ├── logos.ts
│       └── ...
├── _seo
│   ├── robots[.]txt.ts
│   └── sitemap[.]xml.ts
├── admin
│   └── cache
│       ├── index.tsx
│       ├── lru.$cacheKey.ts
│       ├── sqlite.$cacheKey.ts
│       └── sqlite.tsx
├── resources
│   ├── download-user-data.tsx
│   ├── healthcheck.tsx
│   ├── images.tsx
│   └── theme-switch.tsx
├── settings
│   └── profile
│       ├── _layout.tsx
│       ├── change-email.tsx
│       ├── connections.tsx
│       ├── index.tsx
│       ├── passkeys.tsx
│       ├── password.tsx
│       ├── password_.create.tsx
│       ├── photo.tsx
│       └── two-factor
│           ├── _layout.tsx
│           ├── disable.tsx
│           ├── index.tsx
│           └── verify.tsx
└── users
    ├── index.tsx
    └── $username
        ├── index.tsx
        └── notes
            ├── $noteId.tsx
            ├── $noteId_.edit.tsx
            ├── _layout.tsx
            ├── index.tsx
            └── new.tsx

17 directories, 72 files
```

```tsx
<Routes>
	<Route file="root.tsx">
		<Route path="*" file="routes/$.tsx" />
		<Route
			path="auth/:provider/callback"
			file="routes/_auth/auth.$provider/callback.ts"
		/>
		<Route
			path="auth/:provider"
			index
			file="routes/_auth/auth.$provider/index.ts"
		/>
		<Route path="forgot-password" file="routes/_auth/forgot-password.tsx" />
		<Route path="login" file="routes/_auth/login.tsx" />
		<Route path="logout" file="routes/_auth/logout.tsx" />
		<Route
			path="onboarding/:provider"
			file="routes/_auth/onboarding/$provider.tsx"
		/>
		<Route path="onboarding" index file="routes/_auth/onboarding/index.tsx" />
		<Route path="reset-password" file="routes/_auth/reset-password.tsx" />
		<Route path="signup" file="routes/_auth/signup.tsx" />
		<Route path="verify" file="routes/_auth/verify.tsx" />
		<Route
			path="webauthn/authentication"
			file="routes/_auth/webauthn/authentication.ts"
		/>
		<Route
			path="webauthn/registration"
			file="routes/_auth/webauthn/registration.ts"
		/>
		<Route path="about" file="routes/_marketing/about.tsx" />
		<Route index file="routes/_marketing/index.tsx" />
		<Route path="privacy" file="routes/_marketing/privacy.tsx" />
		<Route path="support" file="routes/_marketing/support.tsx" />
		<Route path="tos" file="routes/_marketing/tos.tsx" />
		<Route path="robots.txt" file="routes/_seo/robots[.]txt.ts" />
		<Route path="sitemap.xml" file="routes/_seo/sitemap[.]xml.ts" />
		<Route path="admin/cache" index file="routes/admin/cache/index.tsx" />
		<Route
			path="admin/cache/lru/:cacheKey"
			file="routes/admin/cache/lru.$cacheKey.ts"
		/>
		<Route path="admin/cache/sqlite" file="routes/admin/cache/sqlite.tsx">
			<Route path=":cacheKey" file="routes/admin/cache/sqlite.$cacheKey.ts" />
		</Route>
		<Route path="me" file="routes/me.tsx" />
		<Route
			path="resources/download-user-data"
			file="routes/resources/download-user-data.tsx"
		/>
		<Route
			path="resources/healthcheck"
			file="routes/resources/healthcheck.tsx"
		/>
		<Route path="resources/images" file="routes/resources/images.tsx" />
		<Route
			path="resources/theme-switch"
			file="routes/resources/theme-switch.tsx"
		/>
		<Route path="settings/profile" file="routes/settings/profile/_layout.tsx">
			<Route
				path="change-email"
				file="routes/settings/profile/change-email.tsx"
			/>
			<Route
				path="connections"
				file="routes/settings/profile/connections.tsx"
			/>
			<Route index file="routes/settings/profile/index.tsx" />
			<Route path="passkeys" file="routes/settings/profile/passkeys.tsx" />
			<Route path="password" file="routes/settings/profile/password.tsx" />
			<Route
				path="password/create"
				file="routes/settings/profile/password_.create.tsx"
			/>
			<Route path="photo" file="routes/settings/profile/photo.tsx" />
			<Route
				path="two-factor"
				file="routes/settings/profile/two-factor/_layout.tsx"
			>
				<Route
					path="disable"
					file="routes/settings/profile/two-factor/disable.tsx"
				/>
				<Route index file="routes/settings/profile/two-factor/index.tsx" />
				<Route
					path="verify"
					file="routes/settings/profile/two-factor/verify.tsx"
				/>
			</Route>
		</Route>
		<Route
			path="users/:username"
			index
			file="routes/users/$username/index.tsx"
		/>
		<Route
			path="users/:username/notes"
			file="routes/users/$username/notes/_layout.tsx"
		>
			<Route path=":noteId" file="routes/users/$username/notes/$noteId.tsx" />
			<Route
				path=":noteId/edit"
				file="routes/users/$username/notes/$noteId_.edit.tsx"
			/>
			<Route index file="routes/users/$username/notes/index.tsx" />
			<Route path="new" file="routes/users/$username/notes/new.tsx" />
		</Route>
		<Route path="users" index file="routes/users/index.tsx" />
	</Route>
</Routes>
```

Basically, react-router-auto-routes allows us to get the best of both worlds:

- Colocation of routes to the code they use
- Organized folder structure to keep routes together as needed

If you're familiar with the React Router routing convention, just think of it
this way, react-router-auto-routes takes `+` prefix for colocated modules.
