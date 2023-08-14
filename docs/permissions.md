# Permissions

The Epic Stack's Permissions model takes after
[Role-Based Access Control (RBAC)](https://auth0.com/intro-to-iam/what-is-role-based-access-control-rbac).
Each user has a set of roles, and each role has a set of permissions. A user's
permissions are the union of the permissions of all their roles (with the more
permissive permission taking precedence).

The default development seed creates fine-grained permissions that include
`create`, `read`, `update`, and `delete` permissions for `user` and `note` with
the access of `own` and `any`. The default seed also creates `user` and `admin`
roles with the sensible permissions for those roles.

You can combine these permissions in different ways to support different roles
for different personas of users of your application.

The Epic Stack comes with built-in utilities for working with these permissions.
Here are some examples to give you an idea:

```ts
// server-side only utilities
const userCanDeleteAnyUser = await requireUserWithPermission(
	request,
	'delete:user:any',
)
const userIsAdmin = await requireUserWithRole(request, 'admin')
```

```ts
// UI utilities
const user = useUser()
const userCanCreateTheirOwnNotes = userHasPermission(user, 'create:note:own')
const userIsUser = userHasRole(user, 'user')
```

There is currently no UI for managing permissions, but you can use prisma studio
for establishing these.

## Seeding the production database

Check [the deployment docs](./deployment.md) for instructions on how to seed the
production database with the roles you want.
