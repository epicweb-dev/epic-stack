# Memory

Epic Stack apps start with a single instance with 256MB of memory. This is a
pretty small amount of memory, but it's enough to get started with. To help
avoid memory pressure even at that scale, we allocate a 512MB swap file. Learn
more about this decision in
[the memory swap decision document](decisions/007-swap-file.md).

To modify or increase the swap file, check `other/setup-swap.js`. This file is
executed before running our app within the `litefs.yml` config.

> **NOTE**: PRs welcome to document how to determine the effectiveness of the
> swap file for your app.
