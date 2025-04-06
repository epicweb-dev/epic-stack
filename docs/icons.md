# Icons

The Epic Stack uses SVG sprites for
[optimal icon performance](https://benadam.me/thoughts/react-svg-sprites/).
You'll find raw SVGs in the `./other/svg-icons` directory. These are then
compiled into a sprite using the
[`vite-plugin-icons-spritesheet`](https://github.com/jacobparis-insiders/vite-plugin-icons-spritesheet)
plugin which generates the `app/components/ui/icons/sprite.svg` file and the
accompanying `types.ts` file that allows Typescript to pick up the names of the
icons.

You can use [Sly](https://github.com/jacobparis-insiders/sly/tree/main/cli) to
add new icons from the command line.

To add the `trash`, `pencil-1`, and `avatar` icons, run:

```sh
npx sly add @radix-ui/icons trash pencil-1 avatar
```

If you don't specify the icons, Sly will show an interactive list of all the
icons available in the `@radix-ui/icons` collection and let you select the ones
you want to add.

Sly has been configured in the Epic Stack to automatically add the icons to the
`./other/svg-icons` directory, so there are no extra steps to take. You can see
the configuration in the `./other/sly/sly.json` file.

The SVGs used by default in the Epic Stack come from
[icons.radix-ui.com](https://icons.radix-ui.com/). You can download additional
SVG icons from there, or provide your own. Once you've added new files in the
directory, run `npm run build` and you can then use the `Icon` component to
render it. The `icon` prop is the name of the file without the `.svg` extension.
We recommend using `kebab-case` filenames rather than `PascalCase` to avoid
casing issues with different operating systems.

By default, all the icons will have a height and width of `1em` so they should
match the font-size of the text they're next to. You can also customize the size
using the `size` prop.
