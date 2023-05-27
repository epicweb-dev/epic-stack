# Troubleshooting

This is the page where we document common errors and how to fix them:

## Content Security Policy violations

If you've received an error like this:

> Refused to load the image 'https://example.com/thing.png' because it violates
> the following Content Security Policy directive: "img-src 'self'".

This means you're trying to add a link to a resource that is not allowed. Learn
more about the decision to add this content security policy (CSP) in
[the decision document](https://github.com/epicweb-dev/epic-stack/blob/main/docs/decisions/008-content-security-policy.md).

To fix this, adjust the CSP to allow the resource you're trying to add. This can
be done in the `server/index.ts` file.
