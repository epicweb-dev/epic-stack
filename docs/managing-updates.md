# Managing updates

## Within the Epic Stack

When you create a new project with the Epic Stack, a bunch of code is generated
for you. This code is completely yours and there is no way to update it other
than making manual changes. This is both a good thing and a bad thing. It's good
in the sense that you can tweak it to fit your specific use cases. But it's a
challenge because as the Epic Stack gets improvements there's no way to get
those automatically. You have to keep track of the improvements in the Epic
Stack and make those updates yourself.

You shouldn't feel compelled to keep up-to-date with the latest of the Epic
Stack template. If what you're using is working fine for you then just keep
going with it. Only adopt changes as you feel the need to do so. Feel free to
peruse
[the Epic Stack's commit history](https://github.com/epicweb-dev/epic-stack/commits/main)
anytime you'd like to see what updates could be made to your project.

## How to update NPM dependencies

Another part of the Epic Stack is the dependencies of the project. These you
will also have to keep up-to-date yourself, but there is a bit of an automated
process to help you.

It’s important to update your packages to get new features, bug fixes, and
security patches.
[NPM Check Updates](https://www.npmjs.com/package/npm-check-updates) is a CLI
that will help you safely make those updates. You can watch
[this youtube video](https://www.youtube.com/watch?v=0XQXGx3lLaU) for a
demonstration of how to do this.

### See a list of packages that can be updated

NPM packages follow [semantic versioning](https://semver.org). This command will
show you which packages can be updated and which major, minor, or patch versions
are available.

```sh
npx npm-check-updates
```

Notice the colors:

- Green = (non-major version zero) patch updates
- Cyan = minor updates
- Red = major or [version zero (0.y.z)](https://semver.org/#spec-item-4) updates

### Update green patch versions first, all at once

Since green patch version updates are meant for backward-compatible bug fixes,
it's ok to update them all at once.

```sh
npx npm-check-updates -u --target patch
...
npm i
```

> Note: `npx npm-check-updates -u -t patch` updates all patch versions,
> including major version zero patch versions, which can break your code. If all
> your patch updates are green, feel free to use this command instead to update
> them all at once.

Assuming package maintainers follow semantic versioning, updating patch versions
shouldn't break anything, but it's good practice to re-run your tests before
committing these changes.

```sh
npm run test -- run
npm run test:e2e:run
```

If all tests pass, commit your changes.

```sh
git add .
git commit -m "Updated patch versions"
```

### Update cyan minor versions second, one by one

Minor version updates introduce new features in a backward-compatible way. This
is exciting and it's good practice to take some time to explore the new
functionality and apply relevant updates to your code base or plan to apply them
later. It's recommended you do this package by package instead of all at once.

To check for the new package's features, check its release notes on GitHub.

> If you haven't updated a fairly active package in a while, reading all its
> release notes can take some time. Take into consideration how important a
> package is for your project when choosing which to update first.

```sh
npx npm-check-updates -u -filter <package-with-cyan-minor-update>
npm i
```

Again, assuming package maintainers follow semantic versioning updating patch
versions shouldn't break anything, but it's good practice to re-run your tests
to make sure.

```sh
npm run test -- run
npm run test:e2e:run
```

If all tests pass, commit your changes.

```sh
git add .
git commit -m "Updated minor versions"
```

### Update red versions third, one by one

Red updates can happen on patch or minor versions (for zero major version
(0.y.z) packages) or major versions. Either way, they could be breaking changes.
It's recommended you read its release notes to see what changed and plan
accordingly.

> Again, you might want to take into consideration how important a package is
> for your project when choosing which to update first.

```sh
npx npm-check-updates -u -f <package-with-red-version-update>
npm i
```

Make sure you've made all relevant changes and that the tests pass.

```sh
npm run test -- run
npm run test:e2e:run
```

If all tests pass, commit your changes.

```sh
git add .
git commit -m "Updated <package-with-red-version-update> major version"
```

Then continue for each package.
