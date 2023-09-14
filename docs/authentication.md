# Authentication

The Epic Stack manages its own authentication using web standards and
established libraries and tools.

By default, the Epic Stack offers you two mechanisms for authentication:

1. Username and password authentication
2. Provider authentication

## Username and password authentication

When a user wishes to sign up for an account, they are asked for their email
address. The Epic Stack will send them an email with a code as well as a link.
The user can then enter the code or click the link to verify their email address
which takes them through the onboarding flow which will allow them to set their
username and password.

The password is stored using the [bcrypt](https://npm.im/bcrypt) algorithm.

## Provider authentication

The Epic Stack ships with a system for third party authentication allowing you
to easily add SSO (Single Sign On) to your application. The Epic Stack ships
with support for GitHub OAuth2 authentication out of the box. But you can easily
remove that and/or add other providers. It's all built using
[`remix-auth`](https://npm.im/remix-auth), so any provider supported there, can
be added, including [`web-oidc`](https://npm.im/web-oidc) which handles OpenID
Connect authentication and exports a `remix-auth` compatible auth strategy.

You can check [this example](https://github.com/kentcdodds/epic-oidc) which
shows using OpenID Connect to add Google authentication to the Epic Stack. You
can expand beyond this to add any other provider you'd like, and if you need to
support SAML, you may look into
[`@boxyhq/remix-auth-sso`](https://github.com/boxyhq/remix-auth-sso).

## TOTP and Two-Factor Authentication

Two factor authentication is built-into the Epic Stack. It's managed using a the
[`@epic-web/totp`](https://npm.im/@epic-web/totp) (Time-based One Time
Passwords) utility.

You can read more about the decision to use TOTP in
[the totp decision document](./decisions/014-totp.md). The secret and other
pertinent information is stored in a `verification` model (check the Prisma
schema). This verification model is used as the basis for all TOTP secrets. This
is used for non-expiring Two-Factor Authentication secrets as well as temporary
TOTP codes which are emailed to verify a user's ownership of an email/account.
So it's used for onboarding, forgot password, and change email flows.

When a user has 2FA enabled on their account, they also are required to enter
their 2FA code within 2 hours of performing destructive actions like changing
their email or disabling 2FA. This time is controlled by the
`shouldRequestTwoFA` utility in the `login` full stack component in the resource
routes.
