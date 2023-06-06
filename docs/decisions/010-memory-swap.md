# Memory Swap

Date: 2023-06-02

Status: accepted

## Context

Node.js based apps can use a lot of memory. And while we can scale up the memory
on the instances that run your app, we can't scale it up infinitely. Especially
when we want to be cost sensitive. So we need to be able to handle the case
where your app uses more memory than is available on the instance. A solution to
this is to use swap memory.

Swap memory is a way to use disk space as memory. It's not as fast as real
memory, but it's better than crashing. And it's a lot cheaper than scaling up
the memory on your instances. It makes sense for many types of apps (even at
scale) to use swap memory. Especially for apps just getting off the ground,
making use of swap memory can be a great way to keep costs down.

Because our app is running in a container with a mounted volume, we can't use
the normal swap memory mechanisms. Instead, we need to use a swap file. This
means we need to create a file on the mounted volume and then use that file as
swap memory using `fallocate`, `mkswap`, and `swapon`.

Size of the swap file is pretty subjective to the application and situation. The
Epic Stack app memory starts at 256MB on Fly. Based on that amount of memory, a
good rule of thumb for the size of the swap file is 2-4x the size of memory,
which would put the swap file at 512MB-1GB (for a 2GB+ RAM system, you typically
want the swap file to be the same size as the memory). Considering our volumes
are set to 1GB for starters, we'll start with a 512MB swap file.

## Decision

During app startup, we'll create a swap file on the mounted volume and then use
that file as swap memory for the application.

## Consequences

In high utilization situations, we will have degraded performance instead of a
crash. This is a good tradeoff for most apps.
