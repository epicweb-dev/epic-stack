# Epic Stack local setup

Fork of [epicweb-dev/epic-stack](https://github.com/epicweb-dev/epic-stack) at
[nishilfaldu/epic-stack](https://github.com/nishilfaldu/epic-stack).

Worked from `~/Desktop/epic-stack` on 2026-10-29. `origin` points only at the
fork (`git@github.com:nishilfaldu/epic-stack.git`). No `upstream` remote was
added, and nothing was pushed to `epicweb-dev/epic-stack`.

## What runs locally

The app is a React Router 7 / Express stack with SQLite (Prisma), sessions, RBAC
permissions, and mocked third-party services in development (`MOCKS=true`):
Resend email, GitHub OAuth, Tigris/S3, and pwned-password checks.

- App URL: http://localhost:3000
- Node: `v22.23.4` (via nvm; `package.json` engines is `^22.18.0`)
- npm: `10.9.9`
- Seeded admin: username `kody` / password `kodylovesyou`

## Setup steps that worked

The machine default Node was 24/25. Epic Stack needs Node 22:

```sh
nvm install 22
nvm use 22
git clone git@github.com:nishilfaldu/epic-stack.git ~/Desktop/epic-stack
cd ~/Desktop/epic-stack
cp .env.example .env
npm install
npm run setup          # build, prisma migrate deploy, prisma generate --sql, playwright install
npx prisma@6 db seed
npm run dev            # NODE_ENV=development MOCKS=true
```

`.env.example` values are enough for local mock-mode. Real GitHub/Resend/Tigris
credentials were not configured.

Signup verification emails are written to
`tests/fixtures/email/<address>.json` by the MSW Resend mock. Open the `code`
or `url` from that file on `/verify`.

## Browser proof (http://localhost:3000)

Screenshots live in [`docs/setup-proof/`](docs/setup-proof/).

| Flow | Result | Screenshot |
| --- | --- | --- |
| Homepage | App served | [00](docs/setup-proof/00-homepage.png) |
| Login page | Form rendered | [01](docs/setup-proof/01-login.png) |
| Signup email | Submitted `nishil.setup@example.com` | [02](docs/setup-proof/02-signup.png) |
| Email verification | Mocked OTP `FTK2Y2` from fixture | [03](docs/setup-proof/03-check-email.png) |
| Onboarding | Username `nishilsetup`, name `Nishil Setup` | [04](docs/setup-proof/04-onboarding.png) |
| Signed in | User menu shows Nishil Setup | [05](docs/setup-proof/05-signed-in.png) |
| Create note | Title/content submitted | [06](docs/setup-proof/06-new-note-form.png), [07](docs/setup-proof/07-note-created.png) |
| Edit note | Title and content updated | [08](docs/setup-proof/08-note-edited.png) |
| Delete note | Note gone; empty list | [11](docs/setup-proof/11-note-deleted.png) |
| Permissions (user) | Logged in as `nishilsetup`, kody's note has no Edit/Delete | [09](docs/setup-proof/09-permissions-user-cannot-edit-kody.png) |
| Permissions (user) | `/users/kody/notes/<id>/edit` 404s (owner-only loader) | [10](docs/setup-proof/10-permissions-edit-denied.png) |
| Login | Logged out, signed in as seeded `kody` / `kodylovesyou` | [12](docs/setup-proof/12-logged-in-kody.png) |
| Permissions (admin) | Kody sees Delete on another user's note (`delete:note:any`) | [13](docs/setup-proof/13-admin-can-delete-others.png) |

The admin Delete button on Vicenta Kassulke's note was left unclicked so seed
data stayed intact.

## Test results

All existing suites were run with Node 22.23.4 after `npm run setup`.

| Suite | Command | Result |
| --- | --- | --- |
| Vitest | `npm test -- --run` | **11 files, 42 tests passed** (4.71s) |
| Playwright e2e | `npx playwright test` (Chromium, reused `npm run dev`) | **26 passed** (30.7s) |
| Typecheck | `npm run typecheck` | **passed** |
| ESLint | `npm run lint` | **0 errors**, 3 pre-existing warnings in `remix.init/index.mjs` (`import/order`) |

Playwright files that passed: `2fa`, `error-boundary`, `note-images`, `notes`,
`onboarding`, `passkey`, `search`, `settings-profile`, `static-files`.

## Blocked / not done

- **Fly.io / production deploy** was not attempted. This pass is local-only.
- **Real GitHub OAuth, Resend, Sentry, and Tigris** are mocked. Signup used the
  MSW email fixture, not a real inbox.
- **`npm audit`** reported 69 vulnerabilities in upstream dependencies (6 low,
  23 moderate, 35 high, 5 critical). Left as-is; no lockfile changes.
- **Lint warnings** in `remix.init/index.mjs` are upstream and were not changed.
- Default Node on this machine is 24/25; without `nvm use 22` the engines field
  is not satisfied.
- Browser automation used the Cursor embedded browser at a narrow viewport, so
  screenshots look mobile-width. Behavior was the same as the Playwright
  desktop Chromium suite.

## Recreate

```sh
nvm use 22
cd ~/Desktop/epic-stack
npm run dev
# open http://localhost:3000
# login: kody / kodylovesyou
```
