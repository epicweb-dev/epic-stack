# Features

Here are a few things you get today:

- [Remix](https://remix.run/) is the Web Framework of choice
- [Fly app deployment](https://fly.io/) with [Docker](https://www.docker.com/)
- Multi-region, distributed, production-ready
  [SQLite Database](https://sqlite.org/) with
  [LiteFS](https://fly.io/docs/litefs/).
- Healthcheck endpoint for
  [Fly backups region fallbacks](https://fly.io/docs/reference/configuration/#services-http_checks)
- [Grafana](https://grafana.com/) Dashboards of the running app
- [GitHub Actions](https://github.com/features/actions) with testing and deploy
  on merge for both production and staging environments
- Email/Password Authentication with
  [cookie-based sessions](https://remix.run/utils/sessions#md-createcookiesessionstorage)
- Two-Factor Authentication (2fa) with support for authenticator apps.
- Transactional email with [Resend](https://resend.com/) and forgot
  password/password reset support.
- Progressively Enhanced and fully type safe forms with
  [Conform](https://conform.guide/)
- Database ORM with [Prisma](https://prisma.io/)
- Role-based User Permissions.
- Custom built image hosting
- Caching via [cachified](https://npm.im/@epic-web/cachified): Both in-memory
  and SQLite-based (with
  [better-sqlite3](https://github.com/WiseLibs/better-sqlite3))
- Styling with [Tailwind](https://tailwindcss.com/)
- An excellent, customizable component library with
  [Radix UI](https://www.radix-ui.com/)
- End-to-end testing with [Playwright](https://playwright.dev/)
- Local third party request mocking with [MSW](https://mswjs.io/)
- Unit testing with [Vitest](https://vitest.dev/) and
  [Testing Library](https://testing-library.com/) with pre-configured Test
  Database
- Code formatting with [Prettier](https://prettier.io/)
- Linting with [ESLint](https://eslint.org/)
- Static Types with [TypeScript](https://typescriptlang.org/)
- Runtime schema validation with [zod](https://zod.dev/)
- Error monitoring with [Sentry](https://sentry.io/welcome/)
- Light/Dark/System mode (without a flash of incorrect theme)

Here are some things that will likely find their way into the Epic Stack (or the
docs examples) in the future:

- Logging
- Ecommerce support with [Stripe](https://stripe.com/)
- Ethical site analytics with [fathom](https://usefathom.com/)
- Internationalization
- Image optimization route and component
- Feature flags
- Documentation on production data seeding process

Not a fan of bits of the stack? Fork it, change it, and use
`npx create-remix --template your/repo`! Make it your own.
