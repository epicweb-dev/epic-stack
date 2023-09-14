# Icons

These icons were downloaded from https://icons.radix-ui.com/ which is licensed
under MIT: https://github.com/radix-ui/icons/blob/master/LICENSE

It's important that you only add icons to this directory that the application
actually needs as there's no "tree-shaking" for sprites. If you wish to manually
split up your SVG sprite into multiple files, you'll need to update the
`build-icons.ts` script to do that.

Run `npm run build:icons` to update the sprite.
