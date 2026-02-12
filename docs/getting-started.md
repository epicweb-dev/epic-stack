# Getting Started with the Epic Stack

The Epic Stack is a [Remix Stack](https://remix.run/stacks). To start your Epic
Stack, run the following [`npx`](https://docs.npmjs.com/cli/v9/commands/npx)
command using the current LTS version of Node.js:

```sh
npx epicli new <project-name>
```

This will prompt you for a project name (the name of the directory to put your
project). Once you've selected that, the CLI will start the setup process.

Once the setup is complete, go ahead and `cd` into the new project directory and
run `npm run dev` to get the app started.

Check the project README.md for instructions on getting the app deployed. You'll
want to get this done early in the process to make sure you're all set up
properly.

If you'd like to skip some of the setup steps, you can set the following
environment variables when you run the script:

- `SKIP_SETUP` - skips running `npm run setup`
- `SKIP_FORMAT` - skips running `npm run format`
- `SKIP_DEPLOYMENT` - skips deployment setup

So, if you enabled all of these it would be:

```sh
SKIP_SETUP=true SKIP_FORMAT=true SKIP_DEPLOYMENT=true npx epicli new
```

Or, on windows:

```
set SKIP_SETUP=true && set SKIP_FORMAT=true && set SKIP_DEPLOYMENT=true && npx epicli new
```

## Development

- Initial setup:

  ```sh
  npm run setup
  ```

- Seed database:

  ```sh
  npx prisma migrate reset --force
  ```

- Start dev server:

  ```sh
  npm run dev
  ```

This starts your app in development mode, rebuilding assets on file changes.

The database seed script creates a new user with some data you can use to get
started:

- Username: `kody`
- Password: `kodylovesyou`
