# Route-based Dialogs (aka Modals)

Date: 2023-07-14

Status: accepted

## Context

Dialogs (also known as modals) are often a crutch for poor UX design. They are
often used when you haven't thought through the design of the page within the
context of the user's intentions.

They aren't always bad though. Sometimes they are useful to provide a
confirmation step before a destructive action. For this we already have the
`useDoubleCheck` hook which makes it easier to help the user confirm their
action, but using a dialog gives you the opportunity to explain to the user a
bit more before the action is completed.

However, using Dialogs for routes is problematic. Dialogs without animations are
poor UX. But server rendering animations is problematic because it means the
user has to wait for the animation code to load before they see the content they
came for.

Unsplash solves this problem by using dialogs for images when you click on them,
but when you refresh the page you see that image's page. This is an intentional
decision by them and I'm sure they weighed the pros and cons for this UX.
However, it's not often this is a good user experience.

Until today, the Epic Stack used route-based dialogs for the 2FA flow and the
avatar edit experience. I like using routes for these so it's easy to link the
user directly to these pages and makes it easier to navigate in and out of them.

These are definitely not a good use of route-based dialogs. It certainly doesn't
make sense to render it as a dialog for a client-navigation but something else
for landing on that page like unsplash does for its images.

## Decision

Remove route-based dialogs from the Epic Stack.

## Consequences

A better UX. What used to be dialogs will now simply be pages. To help with
navigation, we'll need to use breadcrumbs to help the user orient themselves and
find a way back to where they came from.
