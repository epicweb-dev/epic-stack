# Toasts

Toast messages are great ways to temporarily call someone's attention to
something. They are often used to notify users of a successful or failed action.

![toasts](https://github.com/epicweb-dev/epic-stack/assets/1500684/715d754a-9e9f-4b61-814f-881121f2fa48)

There are utilities in the Epic Stack for toast notifications.

This is managed by a special session using a concept called "flash data" which
is a temporary session value that is only available for the next request. This
is a great way to pass data to the next request without having to worry about
the data persisting in the session. And you don't have to worry about managing
state either. It all just lives in the cookie.

The primary utility you'll use for redirecting with toast notifications is
`redirectWithToast` from `app/utils/toast.server.ts`. Here's a simple example of
using this:

```tsx
return redirectWithToast(`/users/${note.owner.username}/notes/${note.id}`, {
	description: id ? 'Note updated' : 'Note created',
})
```

This accepts an additional argument for other `ResponseInit` options so you can
set other headers, etc.

If you don't wish to redirect, you could use the underlying `createToastHeaders`
directly:

```tsx
return json(
	{ success: true },
	{
		headers: await createToastHeaders({
			description: 'Note updated',
			type: 'success',
		}),
	},
)
```

And if you need to set multiple headers, you can use the `combineHeaders`
utility from `app/utils/misc.tsx`:

```tsx
return json(
	{ success: true },
	{
		headers: combineHeaders(
			await createToastHeaders({
				toast: {
					description: 'Note updated',
					type: 'success',
				},
			}),
			{ 'x-foo': 'bar' },
		),
	},
)
```
