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
