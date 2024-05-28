# Deployment

When you first create an Epic Stack repo, it should take you through a series of
questions to get your app setup and deployed. However, we'll document the steps
here in case things don't go well for you or you decide to do it manually later.
Here they are!

## Deploying to Fly.io

Prior to your first deployment, you'll need to do a few things:

1. [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/).

   > **Note**: Try `flyctl` instead of `fly` if the commands below won't work.

2. Sign up and log in to Fly:

   ```sh
   fly auth signup
   ```

   > **Note**: If you have more than one Fly account, ensure that you are signed
   > into the same account in the Fly CLI as you are in the browser. In your
   > terminal, run `fly auth whoami` and ensure the email matches the Fly
   > account signed into the browser.

3. Create two apps on Fly, one for staging and one for production:

   ```sh
   fly apps create [YOUR_APP_NAME]
   fly apps create [YOUR_APP_NAME]-staging
   ```

   > **Note**: Make sure this name matches the `app` set in your `fly.toml`
   > file. Otherwise, you will not be able to deploy.

4. Initialize Git.

   ```sh
   git init
   ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the
  remote for your project. **Do not push your app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

5. Add secrets:

- Add a `FLY_API_TOKEN` to your GitHub repo. To do this, go to your user
  settings on Fly and create a new
  [token](https://web.fly.io/user/personal_access_tokens/new), then add it to
  [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
  with the name `FLY_API_TOKEN`.

- Add a `SESSION_SECRET`, `INTERNAL_COMMAND_TOKEN`, and `HONEYPOT_SECRET` to
  your fly app secrets, to do this you can run the following commands:

  ```sh
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) HONEYPOT_SECRET=$(openssl rand -hex 32) --app [YOUR_APP_NAME]
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) HONEYPOT_SECRET=$(openssl rand -hex 32) --app [YOUR_APP_NAME]-staging
  ```

  > **Note**: If you don't have openssl installed, you can also use
  > [1Password](https://1password.com/password-generator) to generate a random
  > secret, just replace `$(openssl rand -hex 32)` with the generated secret.

- Add a `ALLOW_INDEXING` with `false` value to your non-production fly app
  secrets, this is to prevent duplicate content from being indexed multiple
  times by search engines. To do this you can run the following commands:

  ```sh
  fly secrets set ALLOW_INDEXING=false --app [YOUR_APP_NAME]-staging
  ```

6. Create production database:

   Create a persistent volume for the sqlite database for both your staging and
   production environments. Run the following (feel free to change the GB size
   based on your needs and the region of your choice
   (`https://fly.io/docs/reference/regions/`). If you do change the region, make
   sure you change the `primary_region` in fly.toml as well):

   ```sh
   fly volumes create data --region sjc --size 1 --app [YOUR_APP_NAME]
   fly volumes create data --region sjc --size 1 --app [YOUR_APP_NAME]-staging
   ```

7. Attach Consul:

- Consul is a fly-managed service that manages your primary instance for data
  replication
  ([learn more about configuring consul](https://fly.io/docs/litefs/getting-started/#lease-configuration)).

  ```sh
  fly consul attach --app [YOUR_APP_NAME]
  fly consul attach --app [YOUR_APP_NAME]-staging
  ```

8. Commit!

   The Epic Stack comes with a GitHub Action that handles automatically
   deploying your app to production and staging environments.

   Now that everything is set up you can commit and push your changes to your
   repo. Every commit to your `main` branch will trigger a deployment to your
   production environment, and every commit to your `dev` branch will trigger a
   deployment to your staging environment.

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

If you'd like to deploy locally you definitely can with

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
docker build -t epic-stack . -f other/Dockerfile --build-arg COMMIT_SHA=`git rev-parse --short HEAD` # builds the docker container
mkdir ~/litefs # mountpoint for your sqlite databases
docker run -d -p 8081:8081 -e SESSION_SECRET='somesecret' -e INTERNAL_COMMAND_TOKEN='somesecret' -e HONEYPOT_SECRET='somesecret' -e FLY='false' -v ~/litefs:/litefs epic-stack     # Runs the docker container. http://localhost:8081 should now point to your docker instance. ~/litefs directory has the sqlite databases
```
