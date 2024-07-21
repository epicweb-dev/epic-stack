# Node Version

As the [Node Version](./decisions/021-node-version.md) decision document, we use the latest `node` LTS version. As `node` evolves, the LTS version will change. We updating the `node` version, 3 files need changing:

- `other/Dockerfile`: the base image number
- `.nvmrc`: the version of `node` used in GitHub Actions and the version `nvm use` (if you use it) will use
- `package.json`: the `.engines.node` field
