# Sitemaps

Date: 2023-06-05

Status: deprecated

> Update: The contribution in
> [#456](https://github.com/epicweb-dev/epic-stack/pull/456) made it quite easy
> to handle a sitemap so this decision has been reversed.

## Context

[Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
are useful to help website crawlers (like search engines) find all the content
on your website. Most of the time they aren't necessary if you're linking
between pages well. However, for large websites with lots of content that are
highly search engine sensitive, they can be useful.

It's normally not a big deal to get them wrong if you don't care about it, but
if you really don't care about it, having the code for it can get in the way and
it's kind of annoying.

## Decision

Instead of building a sitemap into the template, we'll use
[an example](/docs/examples.md) people can reference to add a sitemap to their
Epic Stack sites if they like.

## Consequences

This turns sitemaps into an opt-in for developers using the Epic Stack. Most
people using the Epic Stack probably don't need a sitemap, and those who do will
only need a few minutes of following the example to get it working.
