# Client Hints

> **NOTE:** Find background on this concept in the decision document:
> `0005-client-pref-cookies.md`.

[Watch the tip](https://www.epicweb.dev/tips/use-client-hints-to-eliminate-content-layout-shift)
on [EpicWeb.dev](https://www.epicweb.dev):

[![Kent smiling with VSCode showing code in the client-hints.tsx file](https://github.com/epicweb-dev/epic-stack/assets/1500684/ede18d0a-c117-4c65-9f1e-a87f262e4ce1)](https://www.epicweb.dev/tips/use-client-hints-to-eliminate-content-layout-shift)

## The Problem

Sometimes your server render code needs to know something about the client that
the browser doesn't send. For example, the server might need to know the user's
preferred language, or whether the user prefers light or dark mode.

For some of this you should have user preferences which can be persisted in a
cookie or a database, but you can't do this for first-time visitors. All you can
do is guess. Unfortunately, if you guess wrong, you end up with a bad experience
for the user.

And what often happens is we render HTML that's wrong and then hydrate the
application to be interactive with client-side JavaScript that now knows the
user preferences and now we know the right thing to render. This is great,
except we've already render the wrong thing so by hydrating we cause a shift
from the wrong thing to the right thing which is jarring and can be even a worse
user experience than leaving the wrong thing in place (I call this a "flash of
incorrect content"). You'll get an error in the console from React when this
happens.

## The Solution

Client hints are a way to avoid this problem. The standards for this are still a
work in progress and there is uncertainty when they will land in all major
browsers we are concerned with supporting. So the Epic Stack comes with built-in
support for a "ponyfill" of sorts of a similar feature to the client hints
headers proposed to the standard.

The idea behind the standard is when the browser makes a request, instead of
responding to the request immediately, the server instead responds to the client
informing it there's a need for certain headers. The client will then repeat
the request with those headers added. The server can then respond with the
correct content.

Our solution is inspired by this, but instead of headers we use cookies. In
`app/utils/client-hints.tsx` we have a component called `ClientHintCheck` which
is rendered in the `<head>` of our document before anything else. That component
renders a small and fast inline script which checks the user's cookies for the
expected client hints. If they are not present or if they're outdated, it sets a
cookie and triggers a reload of the page. Effectively doing the same thing the
browser would do with the client hints headers.

This allows us to server render the right thing for first time visitors without
triggering a content layout shift or a flash of incorrect content. After that
first render, the client will have the correct cookies and the server will
render the right thing every time thereafter.

The built-in template currently only has support for the user's color scheme
preference, but you can add more for your application's needs.
