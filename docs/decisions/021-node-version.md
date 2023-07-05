# Node.js LTS

Date: 2023-07-03

Status: accepted

## Context

Node.js has a regular release cycle which is documented in the
[release schedule](https://nodejs.org/en/about/releases/). At the time of this
writing, there are 3 stable maintained releases: 16, 18, and 20. I'll refer you
to that documentation to understand how the release cycle works.

Deciding which version of Node.js to use for a project is a trade-off between
using the latest features and stability.

The Epic Stack is more focused on stabling shipping web apps than experimenting
with the latest features which is where the Active Long-Term Support (LTS)
version really shines.

We deploy our apps in Docker containers, and there are various base images we
can use as options which you can find on
[the Node.js Docker Hub](https://hub.docker.com/_/node). Aside from the version,
there flavors of the base image which are based on the Linux distribution used.
Feel free to read more about the different flavors on Docker Hub. One of the
goals for us here is to not ship more than we need in production.

An additional consideration we'll add as context here is what version of Linux
to have our base image built on. With the same pragmatic approach as the Node.js
version we want to balance latest features with stability. We'll use the
[Debian release cycle](https://wiki.debian.org/DebianReleases) as a guide for
this.

## Decision

Use and current LTS version of Node.js as the default in the starter.

We'll use the `slim` flavor of the node.js images.

We'll use the `bookworm` flavor of the node.js images (which is the current
stable version of Dabian: v12).

## Consequences

Folks should hopefully run into few compatibility issues. It's possible they
will need features that are not back-ported to the current active LTS version,
however it's trivial to update the Node.js version. Added documentation to the
[managing updates](../managing-updates.md) docs should help people manage this.

We'll need to update the Node.js version in the starter whenever the active LTS
version changes.

Folks who need a bunch more out of their operating system packages will need to
switch from the `slim` flavor which only involves updating the `Dockerfile`. It
is possible some will not realize they need more than `slim` until they run the
Docker image (which many people will only do in production). However the
likelihood of this impacting anyone is pretty low.
