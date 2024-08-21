# Favicon

This directory has the icons used for android devices. In
some cases, we cannot reliably detect light/dark mode preference. Hence these icons should not have a transparent background. These icons are
referenced in the `site.webmanifest` file.

The icons used by modern browsers and Apple devices are in `app/assets/favicons` as they can be imported with a fingerprint to bust the browser cache.

Note, there's also a `favicon.ico` in the root of `/public` which some older
browsers will request automatically. This is a fallback for those browsers.
