# Deployment

When you first create an Epic Stack repo, it should take you through a series of
questions to get your app setup and deployed. However, we'll document the steps
here in case things don't go well for you or you decide to do it manually later.
Here they are!

## Deploying to Fly.io

Prior to your first deployment, you'll need to do a few things:

1. [Install the Github CLI](https://cli.github.com/)

1. Login to GitHub:

   ```sh
   gh auth login
   ```

1. [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/).

   > **Note**: Try `flyctl` instead of `fly` if the commands below won't work.

1. Sign up and log in to Fly:

   ```sh
   fly auth signup
   ```

   > **Note**: If you have more than one Fly account, ensure that you are signed
   > into the same account in the Fly CLI as you are in the browser. In your
   > terminal, run `fly auth whoami` and ensure the email matches the Fly
   > account signed into the browser.

1. Create a Fly app for production:

   ```sh
   fly apps create [YOUR_APP_NAME]
   ```

1. Change the app name in fly.toml to name of the app you just created.

1. Initialize Git.

   ```sh
   git init
   ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the
  remote for your project. **Do not push your app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

1. Add secrets:

- Create a `FLY_API_TOKEN` by running:

  ```sh
  fly tokens org
  ```

- Add this token to your GitHub repo:

  ```sh
  gh secret set FLY_API_TOKEN --body "<token>"
  ```

- Add a `SESSION_SECRET` and `HONEYPOT_SECRET` to your fly app secrets for
  production:

  ```sh
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) HONEYPOT_SECRET=$(openssl rand -hex 32)
  ```

> **Note**: If you don't have openssl installed, you can also use
> [1Password](https://1password.com/password-generator) to generate a random
> secret, just replace `$(openssl rand -hex 32)` with the generated secret.

1. Create production database:

   Create a persistent volume for the sqlite database for your production
   environment. Run the following (feel free to change the GB size based on your
   needs and the region of your choice
   (`https://fly.io/docs/reference/regions/`). If you do change the region, make
   sure you change the `primary_region` in fly.toml as well):

   ```sh
   fly volumes create data --region sjc --size 1
   ```

1. Attach Consul:

- Consul is a fly-managed service that manages your primary instance for data
  replication
  ([learn more about configuring consul](https://fly.io/docs/litefs/getting-started/#lease-configuration)).

  ```sh
  fly consul attach
  ```

1. Set up Tigris object storage:

   ```sh
   fly storage create
   ```

   This will create a Tigris object storage bucket for your production
   environment. The bucket will be used for storing uploaded files and other
   objects in your application. This will also automatically create the
   necessary environment variables for your app. During local development, this
   is completely mocked out so you don't need to worry about it.

1. Commit!

   The Epic Stack comes with a GitHub Action that handles automatically
   deploying your app to production and staging environments.

   Now that everything is set up you can commit and push your changes to your
   repo. Every commit to your `main` branch will trigger a deployment to your
   production environment, and every commit to a PR will trigger a deployment to
   your staging environment.

---

### Optional: Email service setup

Find instructions for this optional step in [the email docs](./email.md).

### Optional: Error monitoring setup

Find instructions for this optional step in
[the error tracking docs](./monitoring.md).

### Optional: Connecting to your production database

Find instructions for this optional step in [the database docs](./database.md).

### Optional: Seeding Production

Find instructions for this optional step in [the database docs](./database.md).

## Deploying locally using fly

If you'd like to deploy locally, just run fly's deploy command:

```
fly deploy
```

## Deploying locally using docker/podman

If you'd like to deploy locally by building a docker container image, you
definitely can. For that you need to make some minimal changes to the Dockerfile
located at other/Dockerfile. Remove everything from the line that says (#prepare
for litefs) in "other/Dockerfile" till the end of file and swap with the
contents below.

```
# prepare for litefs
VOLUME /litefs
ADD . .

EXPOSE ${PORT}
ENTRYPOINT ["/myapp/other/docker-entry-point.sh"]
```

There are 2 things that we are doing here.

1. docker volume is used to swap out the fly.io litefs mount.
2. Docker ENTRYPOINT is used to execute some commands upon launching of the
   docker container

Create a file at other/docker-entry-point.sh with the contents below.

```
#!/bin/sh -ex

npx prisma migrate deploy
sqlite3 /litefs/data/sqlite.db "PRAGMA journal_mode = WAL;"
sqlite3 /litefs/data/cache.db "PRAGMA journal_mode = WAL;"
npm run start
```

This takes care of applying the prisma migrations, followed by launching the
node application (on port 8081).

Helpful commands:

```
# builds the docker container
docker build -t epic-stack . -f other/Dockerfile --build-arg COMMIT_SHA=`git rev-parse --short HEAD`

# mountpoint for your sqlite databases
mkdir ~/litefs

# Runs the docker container.
docker run -d -p 8081:8081 -e SESSION_SECRET='somesecret' -e HONEYPOT_SECRET='somesecret' -e FLY='false' -v ~/litefs:/litefs epic-stack

# http://localhost:8081 should now point to your docker instance. ~/litefs directory has the sqlite databases
```
