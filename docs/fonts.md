# Fonts

The Epic Stack uses the default font that comes with Tailwind CSS. This is a
good default font but you may want to use a custom font for your site and it's
easy to do so.

## Using Custom Fonts

You can use custom fonts by adding them to the `./public/fonts` directory,
[Google Fonts](https://fonts.google.com/) is a good place to find open source
fonts. You will also need to add the `css` file for the font to the
`./app/styles` directory, if your font doesn't come with one (Google Fonts
don't) you can generate one using a tool like
[Transfonter](https://transfonter.org/).

You may need to edit the `url` property in the `css` file to point to the
correct location of the font files, that path is relative to the `public`
folder. So it should look something like
`url('/fonts/yourfont/yourfont-200.woff2')`.

Now you've added your font, there's a few places you need to update to use it.

1. Add your font to the CSS variables.

   ```css
   /* tailwind.css */
   @layer base {
   	:root {
   		--font-sans: <YourFont>;
   	}
   }
   ```

2. Add your font to the `fontFamily` property.

   ```ts
   // tailwind.config.ts
   extend: {
   	...
   	fontFamily: {
   		...
   		sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
   	}
   }

   ```

3. Import your font stylesheet.

   ```tsx
   // root.tsx
   import fontStyleSheetUrl from './styles/yourfont.css'
   ```

   Add the font stylesheet to the links array.

   ```tsx
   // root.tsx
   ...
   { rel: 'preload', href: fontStyleSheetUrl, as: 'style' },
   { rel: 'stylesheet', href: fontStyleSheetUrl },
   ```

That's it! You can now use your custom font should now be available to use in
your site.

## Font Metric Overrides

When using custom fonts, your site elements may stretch or shrink to accommodate
the font. This is because the browser doesn't know the dimensions of the font
you're using until it arrives, which introduces Cumulative Layout Shift and
impact its web vitals.

In Epic Stack, we fixed this by introducing
[Font Metric Overrides](https://github.com/epicweb-dev/epic-stack/pull/128/files).

Follow the steps below to add Font Metric Overrides to your custom fonts.

1. Generate the overrides for your font.

   You can use [fontpie](https://www.npmjs.com/package/fontpie) utility to
   generate the overrides. For each of your fonts, write the following in your
   terminal:

   ```bash
   npx fontpie ./local/font/location.woff2 -w font-weight -s normal/italic -n YourFont
   ```

   #### Example

   ```sh
   npx fontpie ./public/fonts/nunito-sans/nunito-sans-v12-latin_latin-ext-200.woff2 -w 200 -s normal -n NunitoSans
   ```

   ```css
   @font-face {
   	font-family: 'NunitoSans Fallback';
   	font-style: normal;
   	font-weight: 200;
   	src: local('Arial');
   	ascent-override: 103.02%;
   	descent-override: 35.97%;
   	line-gap-override: 0%;
   	size-adjust: 98.13%;
   }
   ```

   If you've got a lot of font files to override, you can use
   [fontpie-from-css](https://github.com/matt-kinton/fontpie-from-css) to
   generate the overrides from a CSS file.

   ```sh
   npx fontpie-from-css ./public/fonts/yourfont/yourfont.css
   ```

   **_Note:_** _If you've been following the steps above, you might have to copy
   your `yourfont.css` file temporarily to the `./public` folder as
   `fontpie-from-css` loads fonts relative to the CSS file._

2. Add the overrides to your font stylesheet.

   Use fontpie for every custom font used (including variants) or
   fontpie-from-css and add the metric overrides to `yourfont.css`.

   _Ensure the original font has the `font-display: swap` property or the
   fallback wouldn't work!_

3. Add the font fallback to the stylesheet.

   ```css
   /* tailwind.css */
   @layer base {
   	:root {
   		--font-sans: <YourFont> <YourFontFallback>;
   	}
   }
   ```

That's it! You can now use your custom font without worrying about Cumulative
Layout Shift!
