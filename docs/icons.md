# Icons

The Epic Stack uses SVG sprites for
[optimal icon performance](https://benadam.me/thoughts/react-svg-sprites/).
You'll find raw SVGs in the `./other/svg-icons` directory. These are then
compiled into a sprite using the `npm run build:icons` script which generates
the `app/components/ui/icon.tsx` file and its associated `icon.svg` file.

The SVGs used by default in the Epic Stack come from
[icons.radix-ui.com](https://icons.radix-ui.com/). You can download additional
SVG icons from there, or provide your own. Once you've added new files in the
directory, run `npm run build:icons` and you can then use the `Icon` component
to render it. The `icon` prop is the name of the file without the `.svg`
extension. We recommend using `kebab-case` filenames rather than `PascalCase` to
avoid casing issues with different operating systems.

Note that [`rmx-cli`](https://github.com/kiliman/rmx-cli) (the tool used to
generate this sprite) automatically removes `width` and `height` props from your
SVGs to ensure they scale properly.

You can also customize the template used for the `Icon` component by editing the
`./other/svg-icon-template.txt` file. `rmx-cli` will simply add the
`type IconNames` at the bottom of the template based on the available icons in
the sprite.

By default, all the icons will have a height and width of `1em` so they should
match the font-size of the text they're next to. You can also customize the size
using the `size` prop.
