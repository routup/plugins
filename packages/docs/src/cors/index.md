---
title: CORS
description: Handle preflight requests and add Access-Control-* response headers.
relatedPlugins: [body, cookie]
plugin:
    package: '@routup/cors'
    summary: 'Preflight and CORS headers.'
    group: 'Operations'
    order: 1
---

# @routup/cors

Lets a browser script on another origin call your API. The plugin answers CORS preflight requests and adds the `Access-Control-*` and `Vary` headers to the other responses, including the cases where a browser ignores a `'*'` on a request with credentials.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)

## Installation

```bash
npm install @routup/cors
```

## Quick Start

<<< @/../examples/cors/quick-start.ts

`cors()` returns a plugin; register it with `app.use()` before the routes it covers ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -i -X OPTIONS http://localhost:3000/ \
  -H 'origin: https://app.example.com' \
  -H 'access-control-request-method: POST' \
  -H 'access-control-request-headers: content-type'
# HTTP/1.1 204 No Content
# access-control-allow-headers: content-type,authorization
# access-control-allow-methods: *
# access-control-allow-origin: https://app.example.com
# content-length: 0
# vary: origin, access-control-request-headers
```

## Default Behaviour

Called without options, `cors()` allows every origin.

| Request | What happens |
|---------|--------------|
| Preflight: `OPTIONS` with `Origin` and `Access-Control-Request-Method` | Answered with `204`, `Content-Length: 0` and the preflight headers; the handlers after the plugin do not run, also when no route matches the path |
| Any other request, also an `OPTIONS` request without both headers | Gets the response headers, then continues to the routes |

| Header | Preflight | Other responses | Default value |
|--------|-----------|-----------------|---------------|
| `Access-Control-Allow-Origin` | yes | yes | `*`, also when the request has no `Origin` |
| `Access-Control-Allow-Credentials` | yes | yes | not sent ([`credentials`](/cors/configuration#credentials)) |
| `Access-Control-Allow-Methods` | yes | no | `*` |
| `Access-Control-Allow-Headers` | yes | no | The request's `Access-Control-Request-Headers`; not sent when the request has none |
| `Access-Control-Max-Age` | yes | no | not sent ([`maxAge`](/cors/configuration#maxage)) |
| `Access-Control-Expose-Headers` | no | yes | `*` |
| `Vary` | yes | yes | `access-control-request-headers` when `Access-Control-Allow-Headers` is sent; `origin` is added whenever `Access-Control-Allow-Origin` is sent with a value other than `*` ([`origin`](/cors/configuration#origin)) |

- **Set, not appended.** The `Access-Control-*` headers overwrite values already on `event.response.headers`; `Vary` values are appended to existing ones.
- **The preflight response is a new `Response`.** It copies the headers already on `event.response`, so a handler registered before the plugin can still add headers to it.
- **A route's own `Response` gets no headers.** The plugin sets the headers on `event.response`, so a route that returns a `Response` object sends none of them. Return a value instead, or build the `Response` with `event.response.headers`. The `404` and error responses routup builds, and the answer of an [error handler](https://routup.dev/guide/error-handling), carry them.
- **Order with other plugins.** Register `cors()` before a rate limiter: [Combining Plugins](/guide/combining).

## Next Steps

- [Configuration](/cors/configuration): every option, with its type and default, and the credentials rules
- [Helpers](/cors/helpers): `handleCors()` for one route, the header functions and the types
- [Recipes](/cors/recipes): one origin, an allow-list, credentials, preflight caching, your own preflight handler
