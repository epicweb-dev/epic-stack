# Images

The Epic Stack distinguishes between user images and static app image assets.
User images are stored in SQLite along with the rest of the application data,
while static images are stored in the [../public/img/](../public/img/) folder.
See the [images decision doc](./decisions/018-images.md) for more details.

## User Images

User images (uploaded by a user) are stored in SQLite and served via resource
routes, for example:
[/resources/user-images/$imageId](../app/routes/resources+/user-images.$imageId.tsx).

## Image Optimization

The Epic Stack uses [openimg](https://github.com/andrelandgraf/openimg) to
optimize images on demand, introduced via
[this decision doc](./decisions/039-image-optimization.md).

### Server Part

The [/resources/images](../app/routes/resources+/images.tsx) endpoint accepts
the search parameters `src`, `w` (width), `h` (height), `format`, and `fit` to
perform image transformations and serve optimized variants. The transformations
are performed with `sharp`, and the optimized images are cached in
`./data/images` on the filesystem and via HTTP caching.

### Client Part

On the client side, the `Img` React component from openimg/react is used to
query the [/resources/images](../app/routes/resources+/images.tsx) endpoint with
the appropriate query parameters, including the source image string. The
component renders a picture element that requests modern formats and sets
attributes such as `fetchpriority`, `loading`, and `decoding` to optimize image
loading. It also computes `srcset` and `sizes` based on the provided `width` and
`height` props. Use the `isAboveFold` prop on the `Img` component to priotize
images that should load immediately.

### Image Sources

If you want to add a new image storage location, like an S3 bucket, update the
[/resources/images](../app/routes/resources+/images.tsx) endpoint and modify the
`getSource` function to instruct openimg on how to retrieve the source images
from the new location. Currently, the endpoint uses fetch requests to retrieve
user images from the resource route endpoints and the filesystem to retrieve
static application assets from the public and assets folders.
