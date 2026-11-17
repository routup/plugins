---
title: Swagger UI Recipes
description: Task-oriented samples for the swagger-ui plugin.
relatedPlugins: [decorators]
---

# Recipes

## Document From an Object

A document built at runtime, here with the server URL of the environment, is passed as an object. With `csp: true`, the server origin is added to `connect-src`, so "Try it out" can call it.

<<< @/../examples/swagger-ui/object-document.ts

```bash
curl -I http://localhost:3000/docs/
# content-security-policy: default-src 'none'; ... connect-src 'self' https://api.example.com; ...
```

## Document From a URL

A URL is not fetched by the server: Swagger UI loads it in the browser, so it must be reachable from there and allow CORS when it is on another origin.

<<< @/../examples/swagger-ui/url-document.ts

## Behind a Reverse Proxy

The plugin sits under `/docs` in an app mounted at `/api`, and a proxy forwards `https://example.com/backend/*` to the app. `basePath` puts the proxy prefix in front of the mount path.

<<< @/../examples/swagger-ui/reverse-proxy.ts

```bash
curl http://localhost:3000/api/docs
# ... <base href="/backend/api/docs/" /> ...
```

When the UI is served under another origin, use [`baseURL`](/swagger-ui/configuration#baseurl) instead.

## OAuth Login

`oauth` is passed to Swagger UI's `initOAuth()` and serves the OAuth redirect page under the mount path. Other Swagger UI options, such as `persistAuthorization`, are passed on as they are.

<<< @/../examples/swagger-ui/oauth.ts

```bash
curl -o /dev/null -w '%{http_code}\n' http://localhost:3000/docs/oauth2-redirect.html
# 200
```

## Embed in a Portal

The recommended policy forbids framing. A `csp` object allows framing by the app itself and by a portal, and lets the UI call one more API; `securityHeaders` adds the other headers.

<<< @/../examples/swagger-ui/frame-policy.ts

```bash
curl -I http://localhost:3000/docs/
# content-security-policy: ... connect-src 'self' https://extra.example.com; ... frame-ancestors 'self' https://portal.example.com
# x-content-type-options: nosniff
# referrer-policy: no-referrer
```

No `x-frame-options` is sent, since it cannot name the portal.
