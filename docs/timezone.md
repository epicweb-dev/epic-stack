# Timezones

Server rendering timezones has always been a pain. This is because the server
doesn't know the user's timezone. It only knows the timezone of the server. So
lots of people will take the easy way out and do one of the following
workarounds:

- Just render in UTC: Not great because it's not the user's timezone
- Render in the server's timezone: Not great because it's not the user's
  timezone
- Render in the server's timezone, and hydrate in the client's timezone: Not
  great because it causes a flash of incorrect content (and a hydration error
  unless you add `suppressHydrationWarning={true}` to the element)
- Don't render the time on the server at all: Not great because it's a flash of
  incomplete content (and no, fading it in does not count).
- Only render the time from user interaction: Sometimes this is fine, but often
  you're just compromising on UX and you know it.

Thanks to the Epic Stack's built-in support for
[client hints](./client-hints.md), we can do better! We have a client hint setup
for the user's timezone which our `getDateTimeFormat` utility uses to give you a
`DateTimeFormat` object that is in the user's timezone (it also uses the
standard `accept-language` header to determine the user's preferred locale).
This means you can render the time on the server in the user's timezone, and
hydrate it in the user's timezone, without any flash of incorrect content or
hydration errors.
