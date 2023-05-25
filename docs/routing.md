# Routing

The Epic Stack uses file-based routing with Remix. However, it's not using the
built-in routing convention of Remix and instead is using
[remix-flat-routes](https://github.com/kiliman/remix-flat-routes) which is a
special implementation of the Remix convention that adds a few features. You'll
find it configured for the application in the `remix.config.js` file at the root
of the app. Specifically "hybrid routes."

We'll defer to the `remix-flat-routes` documentation for specifics, but an
important thing for you to know as you get used to this convention is you can
always run `npx remix routes` from the root of the app and it will output the
routes of your application in a JSX-like output that will reveal the routes that
will be generated based on your current file structure. Here's an example of the
Epic Stack routes at the time of this writing:

```
app/routes
├── _auth+
│   ├── forgot-password.tsx
│   ├── login.tsx
│   ├── logout.tsx
│   ├── onboarding.tsx
│   ├── reset-password.tsx
│   └── signup.tsx
├── _marketing+
│   ├── about.tsx
│   ├── index.tsx
│   ├── logos
│   │   ├── logos.ts
│   │   └── ...
│   ├── privacy.tsx
│   ├── support.tsx
│   └── tos.tsx
├── admin+
│   ├── cache.tsx
│   ├── cache_.lru.$cacheKey.ts
│   ├── cache_.sqlite.$cacheKey.ts
│   └── cache_.sqlite.tsx
├── me.tsx
├── resources+
│   ├── delete-image.test.tsx
│   ├── delete-image.tsx
│   ├── delete-note.tsx
│   ├── file.$fileId.tsx
│   ├── healthcheck.tsx
│   ├── image-upload.tsx
│   ├── login.tsx
│   ├── note-editor.tsx
│   └── theme.tsx
├── settings+
│   ├── profile.photo.tsx
│   └── profile.tsx
└── users+
    ├── $username.tsx
    └── $username_+
        ├── notes.$noteId.tsx
        ├── notes.$noteId_.edit.tsx
        ├── notes.index.tsx
        ├── notes.new.tsx
        └── notes.tsx

9 directories, 54 files
```

```tsx
<Routes>
	<Route file="root.tsx">
		<Route path="forgot-password" file="routes/_auth+/forgot-password.tsx" />
		<Route path="login" file="routes/_auth+/login.tsx" />
		<Route path="logout" file="routes/_auth+/logout.tsx" />
		<Route path="onboarding" file="routes/_auth+/onboarding.tsx" />
		<Route path="reset-password" file="routes/_auth+/reset-password.tsx" />
		<Route path="signup" file="routes/_auth+/signup.tsx" />
		<Route path="about" file="routes/_marketing+/about.tsx" />
		<Route index file="routes/_marketing+/index.tsx" />
		<Route path="privacy" file="routes/_marketing+/privacy.tsx" />
		<Route path="support" file="routes/_marketing+/support.tsx" />
		<Route path="tos" file="routes/_marketing+/tos.tsx" />
		<Route path="admin/cache" file="routes/admin+/cache.tsx" />
		<Route
			path="admin/cache/lru/:cacheKey"
			file="routes/admin+/cache_.lru.$cacheKey.ts"
		/>
		<Route path="admin/cache/sqlite" file="routes/admin+/cache_.sqlite.tsx">
			<Route path=":cacheKey" file="routes/admin+/cache_.sqlite.$cacheKey.ts" />
		</Route>
		<Route path="me" file="routes/me.tsx" />
		<Route
			path="resources/delete-image"
			file="routes/resources+/delete-image.tsx"
		/>
		<Route
			path="resources/delete-note"
			file="routes/resources+/delete-note.tsx"
		/>
		<Route
			path="resources/file/:fileId"
			file="routes/resources+/file.$fileId.tsx"
		/>
		<Route
			path="resources/healthcheck"
			file="routes/resources+/healthcheck.tsx"
		/>
		<Route
			path="resources/image-upload"
			file="routes/resources+/image-upload.tsx"
		/>
		<Route path="resources/login" file="routes/resources+/login.tsx" />
		<Route
			path="resources/note-editor"
			file="routes/resources+/note-editor.tsx"
		/>
		<Route path="resources/theme" file="routes/resources+/theme.tsx" />
		<Route path="settings/profile" file="routes/settings+/profile.tsx">
			<Route path="photo" file="routes/settings+/profile.photo.tsx" />
		</Route>
		<Route path="users/:username" file="routes/users+/$username.tsx" />
		<Route
			path="users/:username/notes"
			file="routes/users+/$username_+/notes.tsx"
		>
			<Route
				path=":noteId"
				file="routes/users+/$username_+/notes.$noteId.tsx"
			/>
			<Route
				path=":noteId/edit"
				file="routes/users+/$username_+/notes.$noteId_.edit.tsx"
			/>
			<Route path="new" file="routes/users+/$username_+/notes.new.tsx" />
			<Route index file="routes/users+/$username_+/notes.index.tsx" />
		</Route>
	</Route>
</Routes>
```

Basically, remix-flat-routes hybrid routing allows us to get the best of both
worlds:

- Colocation of routes to the code they use
- Organized folder structure to keep routes together as needed

If you're familiar with the Remix routing convention, just think of it this way,
remix-flat-routes converts `+/` to `.`.
