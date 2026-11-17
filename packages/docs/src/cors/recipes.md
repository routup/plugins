---
title: CORS Recipes
description: Task-oriented samples for the cors plugin.
relatedPlugins: [body, cookie]
---

# Recipes

## Allow One Origin

An array with one origin reflects that origin and sends no `Access-Control-Allow-Origin` to any other. A plain string would be sent to every origin, leaving the rejection to the browser ([`origin`](/cors/configuration#origin)).

<<< @/../examples/cors/one-origin.ts

```bash
curl -i -H 'origin: https://app.example.com' http://localhost:3000/todos
# access-control-allow-origin: https://app.example.com
# access-control-expose-headers: *
# vary: origin
curl -i -H 'origin: https://other.example' http://localhost:3000/todos
# access-control-expose-headers: *
```

## An Allow-List

A function decides per request; it receives the request's `Origin` and returns `true` to allow it. Here a fixed list plus every numbered preview deployment.

<<< @/../examples/cors/allow-list.ts

```bash
curl -i -H 'origin: https://pr-42.preview.example.com' http://localhost:3000/todos
# access-control-allow-origin: https://pr-42.preview.example.com
# access-control-expose-headers: *
# vary: origin
```

Anchor a pattern at both ends: without the `$`, `https://pr-42.preview.example.com.evil.example` would match.

## Credentials

For cookies or an `Authorization` header sent by the browser, `credentials: true` needs a concrete origin and a list of exposed headers ([`credentials`](/cors/configuration#credentials)).

<<< @/../examples/cors/credentials.ts

The browser script calls `fetch(url, { credentials: 'include' })`. The preflight lists the methods, since `'*'` is expanded under credentials:

```bash
curl -i -X OPTIONS http://localhost:3000/me \
    -H 'origin: https://app.example.com' \
    -H 'access-control-request-method: GET' \
    -H 'access-control-request-headers: authorization'
# HTTP/1.1 204 No Content
# access-control-allow-credentials: true
# access-control-allow-headers: authorization
# access-control-allow-methods: GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
# access-control-allow-origin: https://app.example.com
# content-length: 0
# vary: origin, access-control-request-headers
```

## Preflight Caching

A request with a JSON body or an `Authorization` header is preceded by a preflight. `maxAge` lets the browser reuse the answer, so it sends one preflight per ten minutes instead of one per request.

<<< @/../examples/cors/preflight-cache.ts

```bash
curl -i -X OPTIONS http://localhost:3000/todos \
    -H 'origin: https://app.example.com' \
    -H 'access-control-request-method: POST' \
    -H 'access-control-request-headers: content-type'
# HTTP/1.1 204 No Content
# access-control-allow-headers: content-type,authorization
# access-control-allow-methods: GET,POST,DELETE
# access-control-allow-origin: https://app.example.com
# access-control-max-age: 600
# content-length: 0
# vary: origin, access-control-request-headers
```

Browsers cap the value: Chromium at two hours, Firefox at one day ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age)).

## Your Own Preflight Handler

With `preflight.continue`, the plugin sets the preflight headers and passes the request on, so an `OPTIONS` route decides the response.

<<< @/../examples/cors/own-preflight.ts

```bash
curl -i -X OPTIONS http://localhost:3000/upload \
    -H 'origin: https://app.example.com' \
    -H 'access-control-request-method: PUT'
# HTTP/1.1 204 No Content
# access-control-allow-methods: *
# access-control-allow-origin: *
# x-upload-limit: 10mb
```
