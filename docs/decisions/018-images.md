# Images

Date: 2023-06-23 Updated: 2024-03-19

Status: superseded by
[040-tigris-image-storage.md](./040-tigris-image-storage.md)

## Context

One of the guiding principles of the Epic Stack is to limit services (including
the self-managed variety). Depending on the needs of your application, you may
be justified in reaching for a service to solve this problem. If you have many
large images, then finding a service that can host them for you makes a lot of
sense.

Currently, the Epic Stack stores images in the SQLite database as a blob of
bytes. At first glance, you may think this is a really bad idea, and for some
use cases it definitely would be. But it scales surprisingly well (in some
cases,
[serving small files from SQLite can be faster than the file system](https://www.sqlite.org/fasterthanfs.html)).
In fact, thanks to LiteFS, you get the benefits of replicated storage to all
your app nodes.

Currently, the setup is pretty sub-optimal. There's currently no optimization or
compression of these images. Whatever goes in is what comes out regardless of
needs of the client requesting the image. And if you plan on handling a lot of
images, you could bump against the limits of SQLite + LiteFS (it's been tested
up to 10GBs).

These limits should be fine for a large number of applications, but we don't
want "fine" we want Epic!

Another guiding principle of the Epic Stack is to make things adaptable. We
haven't really come around to this for images yet, but hopefully in the future
there will be a good solution to making it easy to swap from the self-hosted
images to a service.

We also have plans to support automatic optimization of images a la
Cloudinary/Cloudflare.

One thing we're waiting on is
[LiteFS to support object storage](https://github.com/superfly/litefs/issues/327).
Once that's done, then we'll probably move the images to files in your volume
and we'll also be able to use that to cache optimized versions of the images.
This will have limited scale, but should be Epic for many applications.

But all of this is work that hasn't been done yet, so if you're adopting the
Epic Stack, you may consider adjusting the image to use a service. And if you've
got big plans for images in your site, you may want to consider a service.

## Decision

We'll leave things as they are for now mostly due to time constraints. Examples
of using the Epic Stack with services are encouraged and welcome. We definitely
want to make it easy to swap out the self-hosted images for a service, so help
there would be appreciated as well.

## Consequences

People may start off projects that have ambitious image needs without realizing
the image setup here will not satisfy their requirements. A migration would be
annoying, but definitely possible.
