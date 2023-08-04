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

- Add a `SESSION_SECRET` and `INTERNAL_COMMAND_TOKEN` to your fly app secrets,
  to do this you can run the following commands:

  ```sh
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) --app [YOUR_APP_NAME]
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) --app [YOUR_APP_NAME]-staging
  ```

  > **Note**: If you don't have openssl installed, you can also use
  > [1Password](https://1password.com/password-generator) to generate a random
  > secret, just replace `$(openssl rand -hex 32)` with the generated secret.

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

The sqlite database lives at `/data/sqlite.db` in the deployed application.
Because it is SQLite, you cannot connect to it unless you're running a
command-line session on the machine. You can do this using `fly ssh console`.
The Dockerfile simplifies this further by adding a `database-cli` command. You
can connect to the live database by running `fly ssh console -C database-cli`.

To connect to the deployed database from your local machine using Prisma Studio,
you can utilize Fly's ﻿`ssh` and ﻿`proxy` commands.

- Run in one terminal the command to start Prisma Studio on your desired Fly app
  ```sh
  fly ssh console -C "npm run prisma:studio" --app [YOUR_APP_NAME]
  ```
- Run in a second terminal the command to proxy your local port 5556 to Prisma
  Studio
  ```sh
  fly proxy 5556:5555 --app [YOUR_APP_NAME]
  ```

To work with Prisma Studio and your deployed app's database, simply open
`http://localhost:5556` in your browser.

## Seeding Production

Let's say you're building an application that allows users to lookup the nearest
city with a certain population threshold from their geographic location, you'll
need to have a database of cities with their population and geographic
coordinates. You could manually enter this data into your database, but that
would be tedious and error prone. Instead, you can write a script that will
populate your database with the data you need.

The easiest way to seed production data is to use the `sqlite3` command line
tool. You can use raw SQL, or write a script which can be committed to the repo,
generate the database file you like (all while working locally), and then copy
it to your production environment.

It's surprisingly straightforward to do production DB seeding with SQLite 😅

If you have existing data in your production database and you'd like to seed it
with more data, then it's a tiny bit more involved.

1. Backup your production database (lol).
1. Create a new database file (locally) with the data you want to seed.
1. Create a "dump" of the seed database using the `sqlite3` command line tool.
   ```sh nonumber
   sqlite3 seed.db .dump > seed.sql
   ```
1. Copy the `seed.sql` file to your production volume next to your database (via
   `fly sftp`)
1. SSH into your production server and run the following command:
   ```sh nonumber
   sqlite3 data.db < seed.sql
   ```
1. Verify that your production database has been seeded correctly. If it hasn't,
   then restore your backup (asap).

> **Warning**: You may need to adjust some of the SQL generated by the `.dump`
> command to allow you to update the database without issue. It will have
> `CREATE TABLE` commands which should include `IF NOT EXISTS`, but the
> `CREATE UNIQUE INDEX` commands will not. You'll need to add `IF NOT EXISTS` to
> those commands manually, or remove them entirely.

## Deploying locally

If you'd like to deploy locally you definitely can. You need to (temporarily)
move the `Dockerfile` and the `.dockerignore` to the root of the project first.
Then you can run the deploy command:

```
mv ./other/Dockerfile Dockerfile
mv ./other/.dockerignore .dockerignore
fly deploy
```

Once it's done, move the files back:

```
mv Dockerfile ./other/Dockerfile
mv .dockerignore ./other/.dockerignore
```

You can keep the `Dockerfile` and `.dockerignore` in the root if you prefer,
just make sure to remove the move step from the `.github/workflows/deploy.yml`.
