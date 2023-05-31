# Redirects

We handle redirects in Express. Incoming requests are handled by Express before 
they pass through to Remix, so by redirecting earlier you improve performance.

## HTTP to HTTPS

We force all traffic to HTTPS automatically. That way, no part of your application is open to request interception. This does not affect localhost, as we use Fly's request headers for determining when to redirect. 

```ts
app.use((req, res, next) => {
	const proto = req.get('X-Forwarded-Proto')
	const host = getHost(req)
	if (proto === 'http') {
		res.set('X-Forwarded-Proto', 'https')
		res.redirect(`https://${host}${req.originalUrl}`)
		return
	}
	next()
})
```

## Remove trailing slashes

We also remove trailing slashes automatically. A url like `https://example.com/foo/` is automatically redirected to `https://example.com/foo`.

This is important for SEO reasons, as website crawlers (like Google) treat these as separate URLs and will consider them to be distinct pages with duplicate content. 

```ts
app.use((req, res, next) => {
	if (req.path.endsWith('/') && req.path.length > 1) {
		const query = req.url.slice(req.path.length)
		const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
		res.redirect(301, safepath + query)
	} else {
		next()
	}
})
```

## www subdomains

You can redirect root domain traffic to your www subdomain or vice versa.

[DNS level redirects do not work with Fly](https://community.fly.io/t/how-to-redirect-from-non-www-to-www/5795/2). The recommended way to implement this redirect is in your application code.

First, you will need to register SSL certificates for both the www and the root domain. That allows traffic from either source to hit your application, and then you can redirect to your preferred format in code. 

**To redirect non-www traffic to www**
```ts
app.use((req, res, next) => {
  const host = getHost(req)
  if (!host.startsWith("www.")) {
    return res.redirect(301, `https://www.${host}${req.url}`)
  } else {
    next()
  }
})
```

**To redirect www traffic to non-www:**
```ts
app.use((req, res, next) => {
  const host = getHost(req)
  if (host.startsWith("www.")) {
    return res.redirect(301, `https://${host.slice(4)}${req.url}`)
  } else {
    next()
  }
})
```
