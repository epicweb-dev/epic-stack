# Components

Date: 2023-06-27

Status: accepted

## Context

The web platform is severely lacking in terms of UI components. There's pretty
minimal by way of built-in components, and for many that do exist, they are
extremely difficult (if not impossible) to style.

I have yet to build a web application where the product owner was happy with the
user agent styles and capabilities of components that are built into the web
platform.

Unfortunately, building components that work nicely with assistive technologies
in any way you would consider "accessible" is non-trivial. It's certainly not
something that you'd want to do in every new project.

So using a library that provides accessible components users expect is
definitely a good idea. However, many component libraries are difficult to
customize from a styling perspective.

What's best is to get a "headless" UI library: One which handles the logic of
accessible, reusable components, but leaves the styling up to you.

While it may make sense to just say "let's use web components" I'm going to
leave the argument against web components to
[Rich Harris](https://dev.to/richharris/why-i-don-t-use-web-components-2cia)
(he's right, and it pains me just like it does him). The Epic Stack comes with
React, so a component library that leans on React is no problem and actually a
nice benefit.

Having been around the block a few times myself (and even having built a handful
of component libraries), I've determined the library that does this best is
[Radix](https://www.radix-ui.com/). It's a terrific collection of primitive
components that has a fantastically composable API.

The Epic Stack started with Radix from the start for this reason.

That leaves us with the decision about how to style things. The Epic Stack
started with Tailwind for styling (no decision document has been written about
this choice yet), and shipped with things styled by Tailwind. It has worked
relatively well, but the structure has been challenging for folks adopting the
Epic Stack. It's left adopters of the Epic Stack with a lot challenges around
customization.

Customization is always the biggest challenge when it comes to styling
components. Every company wants its own take on the UI, so having a component
library that comes with its styles baked in is a non-starter. This is why we
chose a headless component library in the first place.

This is where [shadcn/ui](https://ui.shadcn.com/) comes into the picture. It's
not a component library, but more of a code registry where you can
copy/paste/modify the code to your heart's content. Additionally, it comes
opinionated with our own opinions! It's built with Tailwind and Radix.

Additionally, while you can easily copy/paste/modify from the website, you can
also use the CLI to download components as needed. So we can add a configuration
file to the Epic Stack and the CLI will know exactly where to place files.

On top of that, shadcn/ui assumes a Tailwind setup that relies heavily on CSS
variables for color styles which makes it much easier to adapt to the light/dark
mode theme of the Epic Stack.

## Decision

We'll adopt shadcn/ui, Radix, and Tailwind as the UI component solution for the
Epic Stack. We'll move most of the custom components that are currently in the
Epic Stack to shadcn/ui components. We'll customize those components as needed.

## Consequences

It's important to keep in mind that because shadcn/ui is not a component
library, updates for these components are similar to updates in the Epic Stack
itself: manual. There is no way to get automated updates here. And this is
actually a good thing, even though it's a bit more work. It's a good thing
because it means that you can customize the components as much as you want
without worrying about breaking changes.
