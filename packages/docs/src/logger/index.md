---
title: Logger
description: Morgan-compatible HTTP request logger for routup, on top of native web-API helpers.
relatedPlugins: []
plugin:
    package: '@routup/logger'
    summary: 'Log requests.'
    group: 'Operations'
    order: 2
---

# @routup/logger

Writes one line per request, with morgan's format strings, tokens and presets. It works with routup's Web `Request` and `Response`, where morgan, written for Node's `(req, res, next)`, has nothing to attach to.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)

## Installation

```bash
npm install @routup/logger
```

## Quick Start

<<< @/../examples/logger/quick-start.ts

`logger()` returns a routup handler, not a plugin: mount it with `app.use()` before the routes it logs ([Mounting](https://routup.dev/guide/handlers#mounting)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl http://localhost:3000/
# server output:
# GET / 200 - - 0.412 ms
```

## Default Behaviour

| Step | What happens |
|------|--------------|
| Start | The logger stores the start time in `event.store` and calls `event.next()` |
| Line | Once the handlers after it have produced the response, it formats the line in the `tiny` format: `:method :url :status :res[content-length] - :response-time ms` |
| Write | It passes the line to `console.log`, then returns the response unchanged |

The line is written before the response goes out: `:response-time` covers the handlers, not sending the body. With [`immediate`](/logger/configuration#immediate), the line is written when the request arrives, before any route runs.

- **Errors and unmatched paths log `-` as status.** When a route throws and no [error handler](https://routup.dev/guide/error-handling) answers, or no route matches, the logger gets no `Response`: routup builds the `500` or `404` response after the logger returned. `:status` and `:res[*]` render `-`; the line is still written. An error handler registered after the routes gives the logger its response and status.
- **`:res[content-length]` is usually `-`.** The tokens read the headers of the `Response` the handlers returned. A plain return value, such as a string or an object, becomes a `Response` without a `Content-Length` header; a `Response` your route returns has the headers you gave it.
- **Mount order matters.** A request answered by a handler registered before `logger()` is not logged. [Combining Plugins](/guide/combining) has the order with `cors()` and `rateLimit()`.
- **A failing `write` does not break a request.** An error thrown by `write` is swallowed. An error thrown by a token, a formatter or `skip` is not: the request fails with it.

## Next Steps

- [Configuration](/logger/configuration): the options, the preset formats and the built-in tokens
- [Helpers](/logger/helpers): `compile()`, `resolveFormat()`, `devFormatter` and the types
- [Recipes](/logger/recipes): a custom format, skipping requests, JSON lines, writing to a file
