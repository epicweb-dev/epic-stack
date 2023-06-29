# Toasts

Toast messages are great ways to temporarily call someone's attention to
something. They are often used to notify users of a successful or failed action.

![confetti](https://github.com/epicweb-dev/epic-stack/assets/1500684/6183b362-5682-4ab0-aa1a-7cc1e4f72f9e)

![toasts](https://github.com/epicweb-dev/epic-stack/assets/1500684/715d754a-9e9f-4b61-814f-881121f2fa48)

There are utilities in the Epic Stack for toast notifications. Additionally, the
same code used to power a toast notification is also used to power the Confetti
component which is used to celebrate when a user signs up for an account (feel
free to remove that or use it for other things as well).

This is managed by a special session using a concept called "flash data" which
is a temporary session value that is only available for the next request. This
is a great way to pass data to the next request without having to worry about
the data persisting in the session. And you don't have to worry about managing
state either. It all just lives in the cookie.

There are two utilities you'll use for redirecting with toast/confetti
notifications from the `app/utils/flash-session.server.ts` file:
`redirectWithToast` and `redirectWithConfetti`. Here's a simple example of using
these:

```tsx
return redirectWithToast(`/users/${note.owner.username}/notes/${note.id}`, {
	title: id ? 'Note updated' : 'Note created',
})
// or
return redirectWithConfetti(safeRedirect(redirectTo, '/'))
```

Each of these accepts an additional argument for other `ResponseInit` options so
you can set other headers, etc.

If you don't wish to redirect, you could use the underlying `flashMessage`
directly:

```tsx
return json(
	{ success: true },
	{
		headers: await flashMessage({
			toast: {
				title: 'Note updated',
				type: 'success',
			},
		}),
	},
)
```

And if you need to set multiple headers, you can pass them as a second argument
to `flashMessage`:

```tsx
flashMessage(
	{
		/* ... */
	},
	{ 'X-My-Header': 'My value' },
)
```
