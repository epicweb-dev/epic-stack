# Secrets

Managing secrets in the Epic Stack is done using environment variables and the
`fly secrets` command.

> **Warning**: It is very important that you do NOT hard code any secrets in the
> source code. Even if your app source is not public, there are a lot of reasons
> this is dangerous and in the epic stack we default to creating source maps
> which will reveal your hard coded secrets to the public. Read more about this
> in [the source map decision document](./decisions/016-source-maps.md).

## Local development

When you need to create a new secret, it's best to add a line to your
`.env.example` file so folks know that secret is necessary. The value you put in
here should be not real because this file is committed to the repository.

To keep everything in line with the [guiding principle](./guiding-principles.md)
of "Offline Development," you should also strive make it so whatever service
you're interacting with can be mocked out using MSW in the `test/mocks`
directory.

You can also put the real value of the secret in `.env` which is `.gitignore`d
so you can interact with the real service if you need to during development.

## Production secrets

To publish a secret to your production application, you can use the
`fly secrets set` command. For staging, use GitHub environment secrets. For
example, if you were integrating with the `tito` API, to set the
`TITO_API_SECRET` secret, you would run the following commands:

```sh
fly secrets set TITO_API_SECRET=some_secret_value --app [YOUR_APP_NAME]
# See how to install gh: https://cli.github.com/
gh secret set TITO_API_SECRET -e staging --body "some_secret_value"
```

Also add the secret to the staging `secrets` section in
.github/workflows/deploy.yml

```yaml
secrets: |
  TITO_API_SECRET=${{ secrets.TITO_API_SECRET }}
```

This will make the secret available to your production and staging environments.
