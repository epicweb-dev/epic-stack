# Getting Started with the Epic Stack

The Epic Stack is a [Remix Stack](https://remix.run/stacks). To start your Epic
Stack, run the following [`pnpm dlx`](https://pnpm.io/cli/dlx) command using
the current LTS version of Node.js:

```sh
pnpm dlx epicli new <project-name>
```

This will prompt you for a project name (the name of the directory to put your
project). Once you've selected that, the CLI will start the setup process.

Once the setup is complete, go ahead and `cd` into the new project directory and
run `pnpm run dev` to get the app started.

The generated `.env` file includes both `DATABASE_PATH` and `DATABASE_URL`.
Keep `DATABASE_URL` as a Prisma SQLite URL that starts with `file:`. If you
have a global `DATABASE_URL` exported in your shell, the setup script will use
the generated project's `.env` value instead.

Check the project README.md for instructions on getting the app deployed. You'll
want to get this done early in the process to make sure you're all set up
properly.

If you'd like to skip some of the setup steps, you can set the following
environment variables when you run the script:

- `SKIP_SETUP` - skips running `pnpm run setup`
- `SKIP_FORMAT` - skips running `pnpm run format`
- `SKIP_DEPLOYMENT` - skips deployment setup

So, if you enabled all of these it would be:

```sh
SKIP_SETUP=true SKIP_FORMAT=true SKIP_DEPLOYMENT=true pnpm dlx epicli new
```

Or, on windows:

```
set SKIP_SETUP=true && set SKIP_FORMAT=true && set SKIP_DEPLOYMENT=true && pnpm dlx epicli new
```

## Development

- Initial setup:

  ```sh
  pnpm run setup
  ```

- Seed database:

  ```sh
  pnpm exec prisma db seed
  ```

- Start dev server:

  ```sh
  pnpm run dev
  ```

This starts your app in development mode, rebuilding assets on file changes.

The database seed script creates a new user with some data you can use to get
started:

- Username: `kody`
- Password: `kodylovesyou`
