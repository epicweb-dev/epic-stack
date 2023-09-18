# Getting Started with the Epic Stack

The Epic Stack is a [Remix Stack](https://remix.run/stacks). To start your Epic
Stack, run the following [`npx`](https://docs.npmjs.com/cli/v9/commands/npx)
command:

```sh
npx create-remix@latest --install --template epicweb-dev/epic-stack
```

This will prompt you for a project name (the name of the directory to put your
project). Once you've selected that, the CLI will start the setup process.

Once the setup is complete, go ahead and `cd` into the new project directory and
run `npm run dev` to get the app started.

Check the project README.md for instructions on getting the app deployed. You'll
want to get this done early in the process to make sure you're all set up
properly.

## Development

- Initial setup:

  ```sh
  npm run setup
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
