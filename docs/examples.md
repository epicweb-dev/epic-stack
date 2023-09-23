# Examples

In keeping with the [guiding principle](guiding-principles.md) to "Minimize
Setup Friction," there are some things that may be pretty common for web
applications to do, but aren't common enough to be included in the main
template.

This page links to examples of how to implement some things with the Epic Stack.

- [Framer Motion](https://github.com/kentcdodds/epic-stack-with-framer-motion)
  by [@kentcdodds](https://github.com/kentcdodds): Using client hints to avoid
  content layout shift with `prefers-reduced-motion` and framer motion
  animations.
- [Cross-site Request Forgery Protection (CSRF)](https://github.com/kentcdodds/epic-stack-with-csrf)
  by [@kentcdodds](https://github.com/kentcdodds): An example of the Epic Stack
  with CSRF protection on forms.
- [Epic Stack + OpenAI](https://github.com/kentcdodds/epic-ai): by
  [@kentcdodds](https://github.com/kentcdodds): An example of the Epic Stack
  with OpenAI's GPT API (enhances the notes feature with "generate" buttons).
- [Prisma Client Extensions](https://github.com/L-Steinmacher/epic-stack-with-prisma-client-extensions)
  by
  [@L-Steinmacher](https://github.com/L-Steinmacher/epic-stack-with-prisma-client-extensions):
  An example of the Epic Stack with Prisma Client extensions activated for enum
  like behavior in SQLite.
- [Epic Stack + Storybook](https://github.com/moishinetzer/epic-stack-with-storybook):
  by [@moishinetzer](https://github.com/moishinetzer): An example of the Epic
  Stack with Storybook. It also showcases creating a Remix stub, which is very
  helpful for isolating Remix-specific components inside of Storybook.
- [Socket.IO](https://github.com/L-Steinmacher/epic-stack-with-socket.io): by
  [@L-Steinmacher](https://github.com/L-Steinmacher): An example of setting up
  using websockets in the Epic Stack using the `Socket.IO` library.
- [User Impersonation](https://github.com/alan2207/epic-stack-with-user-impersonation)
  by [@alan2207](https://github.com/alan2207): An example Remix application
  showcasing how to implement user impersonation in the Epic Stack.
- [Epic Stack + Tailwind CSS Plugin](https://github.com/hakimLyon/epic-stack-with-tailwind-css-plugin)
  by [@hakimLyon](https://github.com/hakimLyon): An example of the Epic Stack
  with Tailwind CSS Plugin.
- [Epic Stack + GitHub Auth](https://github.com/kentcdodds/epic-github-auth) by
  [@kentcdodds](https://github.com/kentcdodds): An example of the Epic Stack
  with GitHub Auth.
- [Epic Stack + MongoDB as the Database](https://github.com/hakimLyon/epic-stack-with-prisma-mongodb)
  by [@hakimLyon](https://github.com/hakimLyon): An example of the Epic Stack
  with Prisma using MongoDB as the database.
- [Epic Stack Custom Themes](https://github.com/kiliman/epic-stack-theme) by
  [@kiliman](https://github.com/kiliman): An example showing how to create a
  custom theme using the
  [`shadcn-custom-theme`](https://github.com/kiliman/shadcn-custom-theme) tool.
- [Epic Stack + OpenID Connect Auth (Google)](https://github.com/kentcdodds/epic-oidc)
  by [@kentcdodds](https://github.com/kentcdodds): An example of the Epic Stack
  with OpenID Connect Auth (Google) using [web-oidc](https://npm.im/web-oidc)
  and [remix-auth](https://npm.im/remix-auth).
- [Epic Stack + Fathom Analytics](https://github.com/xstevenyung/epic-stack-with-fathom-analytics)
  by [@xstevenyung](https://github.com/xstevenyung): An example of the Epic
  Stack with Fanthom Analytics via CDN
- [Epic Stack + Tenant Users](https://github.com/offseat/epic-stack-tenant) by
  [@vinstah](https://github.com/vinstah): An example of the Epic Stack with
  tenant users and members starter
- [Epic Stack + i18n](https://github.com/rperon/epic-stack-with-i18n/) by
  [@rperon](https://github.com/rperon): An example of the Epic Stack with i18n
  using [i18next](https://www.i18next.com/) and
  [remix-18next](https://github.com/sergiodxa/remix-i18next)
- [Epic Stack + Argos](https://github.com/jsfez/epic-stack-with-argos) by
  [@jsfez](https://github.com/jsfez): An example of the Epic Stack
  with [Argos](https://www.argos-ci.com/) for visual testing
- [Epic Stack monorepo with pnpm + turbo](https://github.com/PhilDL/epic-stack-monorepo):
  An example of the Epic Stack in a monorepo setup, configs packages, UI package, and "client-hints" example package.

## How to contribute

[![Kent screencast showing the examples page](https://github.com/epicweb-dev/epic-stack/assets/1500684/7074f1db-c918-42c6-a724-0b082168395f)](https://www.epicweb.dev/tips/contribute-an-epic-stack-example)

Watch:
[Contribute an Epic Stack Example](https://www.epicweb.dev/tips/contribute-an-epic-stack-example)

You don't need permission to contribute an example. Feel free to create your own
repository based on the Epic Stack and add whatever you like for your example.
Here are some tips:

1. Create an `init` commit as soon as you generate the project, before you make
   any changes. That way people can look at the commit history of your example
   and see what you've added.
2. Update the `README.md` with some information about what your example is about
   and call out any interesting things you've done.
3. Add the tags "epic-stack" and "epic-stack-example" so it will appear on
   [this page on GitHub](https://github.com/topics/epic-stack-example).
4. It's not normally necessary to deploy your example to production (simply
   comment out the deployment part of the GitHub workflow), but you can if you
   like.

Once you've made your repo, simply open a pull request to this page and add your
example to the bottom of the list with a brief description.
