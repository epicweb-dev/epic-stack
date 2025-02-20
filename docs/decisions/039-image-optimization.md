# Introduce Image Optimization

Date: 2025-02-19

Status: accepted

## Context

As documented in [018-images.md](./018-images.md), the Epic Stack previously
didn't implement image optimization. Both static app images and dynamic user
images were served as is. However, optimizing images significantly improves web
performance by reducing both the browser load time and the byte size of each
image. On the other hand, one of the guiding principles of the Epic Stack is to
limit services (including the self-managed variety). A great middle ground is to
integrate a simple image optimization solution directly into the web server.
This allows each Epic Stack app to immediately utilize image optimization and
serve better web experiences without prescribing a service.

On-demand image optimization with a image optimization endpoint should be
sufficient for most applications and provide value right out of the gate.
However, it is also important that upgrading to a dedicated service shouldn't be
overly complicated and require a ton of changes.

### Using openimg

The goal of openimg is to be easy to use but also highly configurable, so you
can reconfigure it (or replace it) as your app grows. We can start simple by
introducing a new image optimization endpoint and replace `img` elements with
the `Img` component.

## Decision

Introduce an image optimization endpoint using the
[openimg package](https://github.com/andrelandgraf/openimg). We can then use the
`Img` component to query for optimized images and iterate from there.

In the future, we may decide to look into [unpic-img](https://unpic.pics/img/)
for futher enhancements on the client side and/or look into creating blurred
placeholder images using openimg/node and openimg/vite or alternative solutions.

## Consequences

Serving newly added images will now lead to an image optimization step whenever
a cache miss happens. This increases the image laod time but greatly reduces the
images sizes. On further requests, the load time should also be improved due to
the decreased image sizes.
