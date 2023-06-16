# Source Maps

Date: 2023-06-14

Status: accepted

## Context

If you're unfamiliar with source maps, check out
[What are source maps?](https://web.dev/source-maps/) on web.dev.

For anyone familiar with source maps, it's pretty obvious that you do want these
in production for debugging purposes (read
[Should I Use Source Maps in Production? ](https://css-tricks.com/should-i-use-source-maps-in-production/)).
However, when you enable source maps with Remix, you get a warning that looks
like this:

```
> remix build --sourcemap

Building Remix app in production mode...

⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
You have enabled source maps in production. This will make your server-side code visible to the public and is highly discouraged! If you insist, please ensure you are using environment variables for secrets and not hard-coding them into your source!
⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
```

It's pretty well understood that source maps allow your code to be visible to
the public and yet it's still pretty well understood that's fine because
client-side apps send the code anyway and that can typically be reverse
engineered (especially with the help of modern AI tools as well).

The reason it's a special concern for some frameworks like Remix today is
because the source maps for the client-side code include some of the server-side
code as well. This is because Remix and other frameworks like it have the
ability for you to write your server code in the same file as your browser code.

The ability for the public to view your server-side code understandably raises
some concerns for folks. This is especially dangerous if you have secrets
hard-coded into your server-side code. Additionally, if you're exercising
"security through obscurity" then you may be vulnerable to attacks if your
server-side code is visible.

On the flip side, you really shouldn't be hard-coding secrets into your
server-side code anyway. You should be using environment variables for that.
Additionally, if you're relying on "security through obscurity" then you're
probably not as secure as you think you are.

Also, source maps are necessary for error monitoring with tools like Sentry.
Without source maps, you'll only see the minified code in your error monitoring
tools. This makes it much harder to debug errors in production. And if you're
debugging your application in production you'll also be limited to minified code
as well.

It may be possible to generate the source maps and make them available to
Sentry, but then prevent them from being sent to the client. More research is
needed to determine whether this is possible.

## Decision

We've decided to enable source maps in production by default. This will allow
for better error monitoring and debugging in production. It will also allow for
easier debugging of server-side code in production.

## Consequences

Developers using the Epic Stack will see an warning message during the build and
if they don't practice good secret "hygiene" they may be vulnerable to attacks.
So we'll add documentation explaining how to properly use environment variables
for secrets and not hard-code them into your source code.
