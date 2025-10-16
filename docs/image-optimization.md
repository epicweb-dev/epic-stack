# Image Optimization

The Epic Stack uses [openimg](https://github.com/andrelandgraf/openimg) to
optimize images on demand, introduced via
[this decision doc](./decisions/041-image-optimization.md).

## Server Part

The [/resources/images](../app/routes/resources/images.tsx) endpoint accepts the
search parameters `src`, `w` (width), `h` (height), `format`, and `fit` to
perform image transformations and serve optimized variants. The transformations
are performed with `sharp`, and the optimized images are cached in
`./data/images` on the filesystem and via HTTP caching. All transformations
happen via stream processing, so images are never loaded fully into memory at
once.

## Client Part

On the client side, the `Img` React component from openimg/react is used to
query the [/resources/images](../app/routes/resources/images.tsx) endpoint with
the appropriate query parameters, including the source image string. The
component renders a picture element that requests modern formats and sets
attributes such as `fetchpriority`, `loading`, and `decoding` to optimize image
loading. It also computes `srcset` and `sizes` based on the provided `width` and
`height` props. Use the `isAboveFold` prop on the `Img` component to priotize
images that should load immediately.

## Image Sources

If you want to add a new image storage location, update the
[/resources/images](../app/routes/resources/images.tsx) endpoint and modify
`getSource` and `allowlistedOrigins` to instruct openimg on how to retrieve the
source images from the new location. Currently, the endpoint uses fetch requests
to retrieve user images from the resource route endpoints and the filesystem to
retrieve static application assets from the public and assets folders.
