# Authentication

The Epic Stack manages its own authentication using web standards and
established libraries and tools.

By default, the Epic Stack offers you three mechanisms for authentication:

1. Username and password authentication
2. Provider authentication
3. Passkey authentication

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

### GitHub OAuth App

You will see in `.env.example` the `GITHUB_CLIENT_ID` is set to `MOCK_...`. This
is a precondition for a "Mock GitHub server" to be installed (with the help of
[`msw`](https://github.com/mswjs/msw) library). See this
[module](../tests/mocks/github.ts) for more details and pay attention to how the
calls to `https://github.com/login/oauth/access_token` are being intercepted.
But once deployed to an environment where `process.env.MOCKS` is not set to
`'true'` (see how this is done when launching the
[dev server](../server/dev-server.js) and checked in the
[entrypoint](../index.js)), or even when developing _locally_ but not setting
`GITHUB_CLIENT_ID` to `MOCK_...`, the requests will actually reach the GitHub
auth server. This is where you will want to have a GitHub OAuth application
properly set up, otherwise the logging in with GitHub will fail and a
corresponding toast will appear on the screen.

To set up a real OAuth application, log in to GitHub, go to
`Settings -> Developer settings -> OAuth Apps`, and hit the
`Register a new application` button. Type in `http://localhost:3000` for
"Homepage URL" and `http://localhost:3000/auth/github/callback` for
"Authorization callback URL". As for the `Application name` set to something
meaningful (because your users will see the app's name), e.g.
`MY_EPIC_APPLICATION_DEVELOPMENT`. Hit `Register application` button. You will
be redirected to the page with your newly created OAuth app's details. You will
see your app has got `0` users and no client secrets just yet, but the Client ID
has already been assigned to your app. Copy over this value to
`GITHUB_CLIENT_ID` in your _.env_ file. Now hit `Generate client secret` button,
and copy over the newly generated secret to `GITHUB_CLIENT_SECRET` in the .env
file. Hit `Update application` button on your GitHub OAuth app page.

Your `.env` file should resemble this (values have been redacted):

```bash
# some other secrets and env vars
...

GITHUB_CLIENT_ID="72fa***************a"
GITHUB_CLIENT_SECRET="b2c6d323b**************************eae016"
```

Now, run the epic-stack app in dev mode, go to login page, and use the
`Login with GitHub` option. You will be redirected to GitHub, and prompted to
authorize the "MY_EPIC_APPLICATION_DEVELOPMENT" (or whatever the name of your
OAuth app is) OAuth app to access your GitHub account data. After you give your
consent, you will be redirected to your epic-stack app running on localhost, and
the onboarding will kick off. You can now refresh your GitHub OAuth app page and
see how the number of registered users increased to `1`.

Something to appreciate here, is that you as the GitHub OAuth app owner (since
you created it in your GitHub account) and you as a user authorizing this GitHub
OAuth app to access your account's data are _two different_ entities. The OAuth
app could have been registered with an Organisation or another person's GitHub
account.

Also make sure to register separate additional OAuth apps for each of your
deployed environments (e.g. `staging` and `production`) and specify
corresponding homepage and redirect urls in there.

## Passkey Authentication

The Epic Stack includes support for passkey authentication using the WebAuthn
standard. Passkeys provide a more secure, phishing-resistant alternative to
traditional passwords. They can be stored in your device's secure hardware (like
Touch ID, Face ID, or Windows Hello) or in external security keys.

Users can register multiple passkeys for their account through the passkeys
settings page. Each passkey can be either device-bound (platform authenticator)
or portable (cross-platform authenticator like a security key). The
implementation uses the
[@simplewebauthn/server](https://npm.im/simplewebauthn/server) and
[@simplewebauthn/browser](https://npm.im/simplewebauthn/browser) packages to
handle the WebAuthn protocol.

When a user attempts to log in with a passkey:

1. The server generates a challenge
2. The browser prompts the user to authenticate using one of their registered
   passkeys
3. Upon successful authentication, the user is logged in without needing to
   enter a password

Passkeys offer several advantages:

- No passwords to remember or type
- Phishing-resistant (tied to specific domains)
- Biometric authentication when available
- Can be synced across devices (if the user is using a manager like
  [1Password](https://1password.com/))
- Support for both built-in authenticators (like Touch ID) and external security
  keys

The passkey data is stored in the database using a `Passkey` model which tracks:

- A unique identifier (`id`) for each passkey
- The authenticator's AAGUID (a unique identifier for the make and model of the
  authenticator). This can be used to help the user identify which managers
  their passkeys are from if they have multiple managers.
- The public key used for verification
- A counter to prevent replay attacks
- The device type (platform or cross-platform)
- Whether the credential is backed up
- Optional transport methods (USB, NFC, etc.)
- Creation and update timestamps
- The relationship to the user who owns the passkey

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
