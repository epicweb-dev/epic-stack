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
- [Sitemaps](https://github.com/kentcdodds/epic-stack-with-sitemap) by
  [@kentcdodds](https://github.com/kentcdodds): Automatically generating a
  sitemap and a nice way to handle dynamic routes and customize the sitemap on a
  per-route basis.
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
