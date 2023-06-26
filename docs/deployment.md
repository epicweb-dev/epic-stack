# Deployment

When you first create an Epic Stack repo, it should take you through a series of
questions to get your app setup and deployed. However, we'll document the steps
here in case things don't go well for you or you decide to do it manually later.
Here they are!

The Epic Stack comes with a GitHub Action that handles automatically deploying
your app to production and staging environments.

Prior to your first deployment, you'll need to do a few things:

- [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/)

- Sign up and log in to Fly

  ```sh
  fly auth signup
  ```

  > **Note**: If you have more than one Fly account, ensure that you are signed
  > into the same account in the Fly CLI as you are in the browser. In your
  > terminal, run `fly auth whoami` and ensure the email matches the Fly account
  > signed into the browser.

- Create two apps on Fly, one for staging and one for production:

  ```sh
  fly apps create [YOUR_APP_NAME]
  fly apps create [YOUR_APP_NAME]-staging
  ```

  > **Note**: Make sure this name matches the `app` set in your `fly.toml` file.
  > Otherwise, you will not be able to deploy.

  - Initialize Git.

  ```sh
  git init
  ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the
  remote for your project. **Do not push your app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

- Add a `FLY_API_TOKEN` to your GitHub repo. To do this, go to your user
  settings on Fly and create a new
  [token](https://web.fly.io/user/personal_access_tokens/new), then add it to
  [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
  with the name `FLY_API_TOKEN`.

- Add a `SESSION_SECRET` and `INTERNAL_COMMAND_TOKEN` to your fly app secrets,
  to do this you can run the following commands:

  ```sh
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) --app [YOUR_APP_NAME]
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) --app [YOUR_APP_NAME]-staging
  ```

  If you don't have openssl installed, you can also use
  [1Password](https://1password.com/password-generator) to generate a random
  secret, just replace `$(openssl rand -hex 32)` with the generated secret.

- **Create an account on Resend.** (optional)

  Find instructions for this optional step in [the email docs](./email.md).

- **Create an account on Sentry.** (optional)

  Find instructions for this optional step in
  [the error tracking docs](./monitoring.md).

- Create a persistent volume for the sqlite database for both your staging and
  production environments. Run the following (feel free to change the GB size
  based on your needs and the region of your choice
  (`https://fly.io/docs/reference/regions/`). If you do change the region, make
  sure you change the `primary_region` in fly.toml as well):

  ```sh
  fly volumes create data --region sjc --size 1 --app [YOUR_APP_NAME]
  fly volumes create data --region sjc --size 1 --app [YOUR_APP_NAME]-staging
  ```

- Attach consul to your app. Consul is a fly-managed service that manages your
  primary instance for data replication
  ([learn more about configuring consul](https://fly.io/docs/litefs/getting-started/#lease-configuration)).

  ```sh
  fly consul attach --app [YOUR_APP_NAME]
  fly consul attach --app [YOUR_APP_NAME]-staging
  ```

Now that everything is set up you can commit and push your changes to your repo.
Every commit to your `main` branch will trigger a deployment to your production
environment, and every commit to your `dev` branch will trigger a deployment to
your staging environment.

## Connecting to your database

The sqlite database lives at `/data/sqlite.db` in the deployed application.
Because it is SQLite, you cannot connect to it unless you're running a
command-line session on the machine. You can do this using `fly ssh console`.
The Dockerfile simplifies this further by adding a `database-cli` command. You
can connect to the live database by running `fly ssh console -C database-cli`.

## GitHub Actions

We use GitHub Actions for continuous integration and deployment. Anything that
gets into the `main` branch will be deployed to production after running
tests/build/etc. Anything in the `dev` branch will be deployed to staging.
