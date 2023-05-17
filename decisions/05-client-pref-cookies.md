# Client Preference Cookies

Date: 2023-05-16

Status: accepted

## Context

Server rendering is preferred for most things to avoid content layout shift
(which causes a poor user experience). Unfortunately, there are a number of
limitations with this because the browser doesn't give the server enough
information about the user's preferences. For example:

- `prefers-color-scheme` (light/dark mode)
- `prefers-reduced-data`
- time zone offset
- locale

And much more.

The problem is that if what you display to the user relies on these values, then
what the server renders could be wrong and the user will see the incorrect UI
until client-side JavaScript can take over and correct it which causes a "Flash
of Incorrect UI." This is a terrible user experience.

This is such an issue that the web platform will (hopefully soon) be adding new
user preferences headers to each request for us to know these values on the
server. Read,
[User preference media features client hints headers](https://web.dev/user-preference-media-features-headers/)
and
[User Locale Preferences](https://github.com/romulocintra/user-locale-client-hints).
However, there's no telling when these features will become standard and
implemented in all browsers Epic Stack apps target so we cannot rely on this or
wait for it.

One solution I've used on my personal website is to include a tiny bit of inline
JavaScript in the client that runs before the user has a chance to see anything
to correct any flaws in the UI. This is normally enough, but on extremely slow
connections the user will still see a flash of incorrect UI. It's also quite
complex and pretty hacky.

Another solution I've seen from
[Jacob Paris](https://www.jacobparis.com/content/remix-ssr-dates) is to simply
use cookies to solve this problem. You simply set a cookie in the browser from
the client for every property your application needs and then the server knows
the user preference during the document request and server render. There are two
limitations here:

1. First time users won't have the cookie set
2. The cookie will be stale if the user changes their preference

To solve the first problem, we can simply check that the cookies are set and if
they are not, then we instead send a minimal document that includes a tiny bit
of JavaScript that sets the cookies and then reloads the page. This is not
ideal, however it's effectively as harmful to the user as a redirect which many
websites do anyway (for example, go to `https://youtube.com` and you instantly
get redirected to `https://www.youtube.com`).

To solve the second problem, we can simply keep a tiny bit of JS in the head of
the document that does a quick check of the cookie values and if they are stale,
then it sets them again and triggers a reload. Still not ideal, but again, it's
better than a content layout shift. And hopefully this solution isn't permanent
and we can remove it once the web platform offers a better solution.

To take things further, we can future proof this solution a bit by trying to
adhere to the web platform's proposed solution as closely as possible, so that
when it does become available, we can simply switch from the cookies to headers
and remove the JS, leaving us with few changes to make.

## Decision

Even though the web platform is working on a solution for this, we cannot wait
for it. Despite page reloads being a sub-optimal user experience, it's better
than the content layout shift (flash of incorrect UI) alternative. Therefore, we
will use cookies and reloads to solve this problem.

## Consequences

The user's first page load will be a bit slower than normal (as will any page
load after their preferences change) because we have to do a page reload to set
the cookies. However, this is a one-time cost and the user will not experience
this again until they change their preferences.

The user will not experience content layout shift for any user preferences our
app depends on for the server render. This is a huge win for user experience.
