# Permissions (RBAC)

Date: 2023-08-14

Status: accepted

## Context

Originally, the Epic Stack had a `role` and `permission` model which was quite
limited in its use case. It was not very useful and not based on any real world
scenario:

```prisma
model Role {
  id   String @id @unique @default(cuid())
  name String @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users       User[]
  permissions Permission[]
}

model Permission {
  id   String @id @unique @default(cuid())
  name String @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  roles Role[]
}
```

There are various ways to implement permissions, but a common approach is called
[Role Based Access Control (RBAC)](https://auth0.com/intro-to-iam/what-is-role-based-access-control-rbac).
This is a very flexible approach and can be used in many different ways. As a
more established approach it's also easier to find resources to learn about and
understand it.

## Decision

We're changing the implementation to follow a RBAC model:

```prisma
model Permission {
  id          String @id @default(cuid())
  action      String // e.g. create, read, update, delete
  entity      String // e.g. note, user, etc.
  access      String // e.g. own or any
  description String @default("")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  roles Role[]

  @@unique([action, entity, access])
}

model Role {
  id          String @id @default(cuid())
  name        String @unique
  description String @default("")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users       User[]
  permissions Permission[]
}
```

This allows us to have much more fine grained control over our permissions.
Additionally, we can create utilities for determining whether a user has
permission to perform an action and disallow them from doing so if they do not.

## Consequences

This is a breaking change for the Epic Stack. Anyone wanting to adopt this
permissions model will need to perform a database migration. However, it's
important that we make this change now because the previous model was not great.
This one is.
