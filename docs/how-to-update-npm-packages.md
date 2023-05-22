# How to update NPM packages

It’s important to update your packages to get new features, bug fixes, and security patches. [NPM Check Updates](https://www.npmjs.com/package/npm-check-updates) is a CLI that will help you safely make those updates.

## Install npm-check-updates
```sh
npm i -D npm-check-updates
```

## See a list of packages that can be updated
NPM packages follow [semantic versioning](https://semver.org). This command will show you which packages can be updated and which major, minor, or patch versions are available.

```sh
npx ncu
```

Notice the colors:
- Green = (nonmajor version zero) patch updates
- Cyan = minor updates
- Red = major or [version zero (0.y.z)](https://semver.org/#spec-item-4) updates

## Update green patch versions first, all at once

Since green patch version updates are meant for backward-compatible bug fixes, it's ok to update them all at once.

```sh
npx ncu -u -filter <package-with-green-patch-update>
npx ncu -u -filter <package-with-green-patch-update>
npx ncu -u -filter <package-with-green-patch-update>
...
npm i
```

> Note: `npx ncu -u -t patch` updates all patch versions, including major version zero patch versions, which can break your code. If all your patch updates are green, feel free to use this command instead to update them all at once.

Assuming package maintainers follow semantic versioning, updating patch versions shouldn't break anything, but it's good practice to re-run your tests before committing these changes.

```sh
npm run test
```

If all tests pass, commit your changes.

```sh
git add .
git commit -m "Updated patch versions"
```

## Update cyan minor versions second, one by one

Minor version updates introduce new features in a backward-compatible way. This is exciting and it's good practice to take some time to explore the new functionality and apply relevant updates to your code base or plan to apply them later. It's recommended you do this package by package instead of all at once.

To check for the new package's features, check its release notes on GitHub.

> If you haven't updated a fairly active package in a while, reading all its release notes can take some time. Take into consideration how important a package is for your project when choosing which to update first.

```sh
npx ncu -u -filter <package-with-cyan-minor-update>
npm i
```

Again, assuming package maintainers follow semantic versioning updating patch versions shouldn't break anything, but it's good practice to re-run your tests to make sure.

```sh
npm run test
```

If all tests pass, commit your changes.

```sh
git add .
git commit -m "Updated minor versions"
```

## Update red versions third, one by one

Red updates can happen on patch or minor versions (for zero major version (0.y.z) packages) or major versions. Either way, they could be breaking changes. It's recommended you read its release notes to see what changed and plan accordingly.

> Again, you might want to take into consideration how important a package is for your project when choosing which to update first.

```sh
npx ncu -u -f <package-with-red-version-update>
npm i
```

Make sure you've made all relevant changes and that the tests pass.

```sh
npm run test
```

If all tests pass, commit your changes.

```sh
git add .
git commit -m "Updated <package-with-red-version-update> patch/minot/major version"
```
