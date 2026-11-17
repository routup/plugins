---
title: Cookie
description: Parse request cookies and serialize Set-Cookie headers on the response.
relatedPlugins: [basic, decorators]
plugin:
    package: '@routup/cookie'
    summary: 'Read and set cookies.'
    group: 'Request & response'
    order: 2
---

# @routup/cookie

Reads request cookies and writes `Set-Cookie` headers in a routup app. The `Cookie` header is parsed once per request with [cookie-es](https://github.com/unjs/cookie-es); you set and clear cookies with typed attributes instead of hand-built header strings.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)

## Installation

```bash
npm install @routup/cookie
```

## Quick Start

<<< @/../examples/cookie/quick-start.ts

`cookie()` is a plugin: register it with `app.use()` before the routes that read cookies ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -i http://localhost:3000/ -H 'cookie: visits=3'
# HTTP/1.1 200 OK
# set-cookie: visits=4; Path=/; HttpOnly; SameSite=Lax
#
# {"visits":4}
```

## Default Behaviour

| Step | What happens |
|------|--------------|
| Parse | The middleware parses the `Cookie` header and stores the result on the request; the read helpers only read that store, so changing the header later has no effect |
| Skip | When cookies are stored already, by an earlier `cookie()` or by `setRequestCookies()`, it does not parse again |
| Decode | Each value is decoded with `decodeURIComponent`; a value that does not decode is kept as sent |
| Duplicates | For a name sent more than once, the first value wins |
| Write | `setResponseCookie()` appends one `Set-Cookie` header per call, with `Path=/` unless you pass another `path`; it needs no plugin |

Handlers that run before `cookie()` see no cookies: `useRequestCookies()` returns `{}` and `useRequestCookie()` returns `undefined`. Cookies are not signed or encrypted, so treat every request cookie as client input.

The `Set-Cookie` headers are set on `event.response`, so a route that returns a `Response` object of its own sends none of them.

## Next Steps

- [Configuration](/cookie/configuration): the parse options
- [Helpers](/cookie/helpers): reading, overriding, setting and clearing cookies, with every `Set-Cookie` attribute
- [Recipes](/cookie/recipes): a session cookie, a JSON value, a default for a missing cookie
- [Combining Plugins](/guide/combining#body-cookie-and-query): `@routup/basic` registers `body()`, `cookie()` and `query()` in one call
