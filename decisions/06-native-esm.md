# Native ESM

Date: 2023-05-18

Status: accepted

## Context

Oh boy, where do I start? The history of JavaScript modules is long and
complicated. I discuss this a bit in my talk
[More than you want to know about ES6 Modules](https://kentcdodds.com/talks/more-than-you-want-to-know-about-es-6-modules).
Many modern packages on npm are now publishing esm-only versions of their
packages. This is fine, but it does mean that using them from a CommonJS module
system requires dynamic imports which is limiting.

In Remix v2, ESM will be the default behavior. Everywhere you look, ESM is
becoming more and more the standard module option. CommonJS modules aren't going
anywhere, but it's a good idea to stay on top of the latest.

Sadly, this is a bit of a "who moved my cheese" situation. Developers who are
familiar with CommonJS modules will be annoyed by things they were used to doing
in CJS that they can't do the same way in CJS. The biggest is dynamic (and
synchronous) requires. Another is the way that module resolution changes. There
are some packages which aren't quite prepared for ESM and therefore you end up
having to import their exports directly from the files (like radix for example).
This is hopefully a temporary problem.

## Decision

We're adopting ESM as the default module system for the Epic Stack.

## Consequences

Experienced developers will hit a couple bumps along the way as they change
their mental model for modules. But it's time to do this.

Some tools aren't very ergonomic with ESM. This will hopefully improve over
time.
