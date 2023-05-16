# APIs

Remix routes have the ability to handle both backend code and UI code in the
same file. Remix `loader`s and `action`s are backend code that's tightly coupled
to the UI code for that route.

Additionally, you can define routes that don't have any UI at all. These are
called [resource routes](https://remix.run/docs/en/main/guides/resource-routes).
This allows you to create REST endpoints or a GraphQL endpoint to make your app
data and logic consumable by third parties or additional clients (like a mobile
app). You can also use this to generate PDFs, images, stream multi-media and
more.

The Epic Stack has a few resource routes in place for managing images, the
cache, and even has a few
["full stack components"](https://www.epicweb.dev/full-stack-components) for
components that manage the connection with their associated backend code.
[Watch the talk](https://www.youtube.com/watch?v=30HAT5Quvgk&list=PLV5CVI1eNcJgNqzNwcs4UKrlJdhfDjshf).

So, yes, you can absolutely use the Epic Stack to build APIs for consumption by
third party clients.
