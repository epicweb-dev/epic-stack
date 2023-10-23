# Honeypot Fields

Date: 2023-10-11

Status: accepted

## Context

You can learn all about Honeypot Fields from
[EpicWeb.dev's forms workshop](https://forms.epicweb.dev/06). The TL;DR idea is
spam bots go around the internet filling in forms all over the place in hopes of
getting their spammy links on your site among other things. This causes extra
load on your server and in some cases can cause you issues. For example, our
onboarding process sends an email to the user. If a spam bot fills out the form
with a random email address, we'll send an email to that address and cause
confusion in the best case or get marked as spam in the worst case.

Most of these spam bots are not very sophisticated and will fill in every field
on the form (even if those fields are visually hidden). We can use this to our
advantage by adding a field to the form that is visually hidden and then
checking that it is empty when the form is submitted. If it is not empty, we
know that the form was filled out by a spam bot and we can ignore it.

There are great tools to help us accomplish this (`remix-utils` specifically).

## Decision

We'll implement Honeypot Fields to all our public-facing forms. Authenticated
forms won't need this because they're not accessible to spam bots anyway.

## Consequences

This is a tiny bit invasive to the code, but it doesn't add much complexity.
It's certainly worth the added benefits to our server (and email
deliverability).
