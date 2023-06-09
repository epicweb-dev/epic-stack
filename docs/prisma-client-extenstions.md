# Prisma-Client Extensions

[This document](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions#create-an-extension) is from the official Prisma documentation and  describes how to setup Prisma-Client extensions to set up validation on your models.

## Setting up Prisma-Client Extensions

Since you already have Prisma ORM already installed in your application all you need to do to set up is go to your `schema.prisma` and in the generator for the client add the `previewFeature`.

```typescript
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["clientExtensions"]
}
```

After which remember to generate your Prisma Client after adding `previewFeatures`.

```bash
npx prisma generate
```

For a complete example of a project that uses Prisma Client extensions with Zod validation [here](https://github.com/prisma/prisma-client-extensions/tree/main/input-validation).

### Alternative to enums.

As an alternative to enums in your Epic-Stack application Matt Pocock has a great solution for a Typescript solution/alternative to enums [here](https://youtu.be/jjMbPt_H3RQ?t=312) to give you type safety at compile time.
git fetch upstream
