# Icons

Date: 2023-06-28

Status: accepted

## Context

Icons are a critical part to every application. It helps users quickly identify
different actions they can take and the meaning of different elements on the
page. It's pretty well accepted that SVGs are the way to go with icons, but
there are a few different options for how to go about doing this.

Because the Epic Stack is using React, it may feel obvious to just use a
component per icon and inline the SVG in the component. This is fine, but it's
sub-optimal. I'm not going to spend time explaining why, because
[this article does a great job of that](https://benadam.me/thoughts/react-svg-sprites/).

SVG sprites are no less ergonomic than inline SVGs in React because in either
case you need to do some sort of transformation of the SVG to make it useable in
the application. If you inline SVGs, you have [SVGR](https://react-svgr.com/) to
automate this process. So if we can automate the process of creating and
consuming a sprite, we're in a fine place.

And [rmx-cli](https://github.com/kiliman/rmx-cli) has support for automating the
creation of an SVG sprite.

One drawback to sprites is you don't typically install a library of icons and
then use them like regular components. You do need to have a process for adding
these to the sprite. And you wouldn't want to add every possible icon as there's
no "tree-shaking" for sprites.

## Decision

Setup the project to use SVG sprites with `rmx-cli`.

## Consequences

We'll need to document the process of adding SVGs. It's still possible to simply
install a library of icons and use them as components if you're ok with the
trade-offs of that approach. But the default in the starter will be to use
sprites.
