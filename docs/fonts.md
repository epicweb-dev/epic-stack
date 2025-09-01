# Fonts

The Epic Stack uses the default font that comes with Tailwind CSS. This is a
good default font but you may want to use a custom font for your site and it's
easy to do so.

## Using Custom Fonts

For custom fonts, Epic Stack uses [`fontless`](https://github.com/unjs/fontaine/tree/main/packages/fontless) for automatic font optimization. This provides zero-runtime font loading with proper fallbacks to reduce Cumulative Layout Shift (CLS).

## How it works

Simply use font families in your CSS and `fontless` handles the rest:

```css
.font-title {
  font-family: "Poppins", sans-serif;
}

.body-text {
  font-family: "Inter", sans-serif;
}
```

The plugin will:
- Detect font-family declarations in your CSS
- Resolve fonts from providers (Google Fonts, Bunny Fonts, etc.)
- Generate optimized `@font-face` declarations
- Add metric-based fallback fonts to reduce CLS
- Download and serve font assets from `/_fonts/`

## Troubleshooting

### Fonts not loading in development
This is expected behavior. Fonts are only generated in the build files. To see fonts in development mode, build the application first and then run `npm run dev`.

