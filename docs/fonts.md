## Font Metric Overrides

When using custom fonts, your site elements may stretch or shrink to accomodate
the font. This is because the browser doesn't know the dimensions of the font
you're using until it arrives, which introduces Cumulative Layout Shift and
impact its web vitals.

In Epic Stack, we fixed this by introducing
[Font Metric Overrides](https://github.com/epicweb-dev/epic-stack/pull/128/files).

### Custom Fonts Metric Overrides

Adding metric overrides for your custom fonts is a manual process. Add a font
family fallback name to your `tailwind.config.js` file:

```js
    //tailwind.config.js
    ...
    fontFamily: {
        yourFont: ['YourFont', 'YourFont Fallback'],
    }
```

We'll use the [fontpie](https://www.npmjs.com/package/fontpie) utility to
generate the overrides. For each of your fonts, write the following in your
terminal:

```bash
npx fontpie ./local/font/location.woff2 -w font-weight -s normal/italic -n YourFont
```

### Example

```sh
npx fontpie ./public/fonts/nunito-sans/nunito-sans-v12-latin_latin-ext-200.woff2 -w 200 -s normal -n NunitoSans
```

Use fontpie for every custom font used (including variants) and add the metric
overrides to `font.css`.

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

_Ensure the original font has the `font-display: swap` property or the fallback
wouldn't work!_

That's it! You can now use your custom font without worrying about Cumulative
Layout Shift!
