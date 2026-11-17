---
title: Combining Plugins
description: Which plugins work together, in which order to register them, and the pitfalls of a wrong order.
---

# Combining Plugins

Most apps register several plugins. This page shows the combinations that depend on each other and the order that makes them work; [Getting Started](/guide/getting-started#order-matters) explains why the order of `app.use()` calls matters.

## Body, Cookie and Query

[`@routup/basic`](/basic/) depends on [`@routup/body`](/body/), [`@routup/cookie`](/cookie/) and [`@routup/query`](/query/). `app.use(basic())` registers `body()`, `cookie()` and `query()` in that order, at the position of the call, and the packages' helpers are re-exported under `@routup/basic/body`, `@routup/basic/cookie` and `@routup/basic/query`.

Install the three packages separately when a parser has to run somewhere else than the others, for example the body parser only under `/api`, or when you need only one or two of them and not the other packages as dependencies:

<<< @/../examples/guide/separate-parsers.ts

```bash
curl -X POST 'http://localhost:3000/api/items?page=2' \
    -H 'cookie: session=abc' \
    -H 'content-type: application/json' \
    -d '{"name":"pen"}'
# {"item":{"name":"pen"},"page":"2","session":"abc"}
curl -X POST http://localhost:3000/webhook -H 'content-type: application/json' -d '{"name":"pen"}'
# {"item":{}}
```

## Rate Limit With a Shared Store

[`@routup/rate-limit`](/rate-limit/) keeps its counters in the process by default. With several instances behind a load balancer, each instance counts on its own; pass a `RedisStore` from [`@routup/rate-limit-redis`](/rate-limit-redis/) as the [`store`](/rate-limit/configuration#store) option to share the counters:

<<< @/../examples/guide/shared-store.ts

`new RedisStore()` takes a Redis URL or an existing client; without one, it creates a client for `localhost:6379`.

## Decorators and the Parsers

[`@routup/decorators`](/decorators/) reads the body, the query string and the cookies with the helpers of the parser plugins, so three of its parameter decorators need a plugin registered before `decorators()`:

| Decorator | Needs |
|-----------|-------|
| `@DBody()`, `@DBody(name)` | `body()` from `@routup/body` |
| `@DQuery()`, `@DQuery(name)` | `query()` from `@routup/query` |
| `@DCookies()`, `@DCookie(name)` | `cookie()` from `@routup/cookie` |

`@DPath()`, `@DPaths()`, `@DHeader()`, `@DHeaders()`, `@DContext()`, `@DRequest()`, `@DResponse()` and `@DNext()` read the request event directly and need no plugin. `basic()` registers all three parsers at once.

<<< @/../examples/guide/decorators.ts

Without its plugin, a decorator with a name resolves to `undefined` and one without a name to an empty object; no error is raised.

## A Typical API Stack

A JSON API with a browser client, a rate limit and request logs:

<<< @/../examples/guide/api-stack.ts

| Position | Why there |
|----------|-----------|
| `logger()` first | It logs every response, also a preflight answered by `cors()` and a `429` from `rateLimit()` |
| `cors()` before `rateLimit()` | A preflight is answered without being counted, and the `429` carries the CORS headers, so a browser script can read it |
| `rateLimit()` before the routes | A rejected request never reaches a route |
| `body()` anywhere before the routes | It only stores its options; a route parses the body when it calls `readRequestBody()` |

```bash
curl -i -X OPTIONS http://localhost:3000/todos \
    -H 'origin: https://app.example.com' \
    -H 'access-control-request-method: POST'
# HTTP/1.1 204 No Content
# access-control-allow-origin: https://app.example.com
```

## Ordering Pitfalls

Each of these registers without an error and fails silently at request time:

- **A route before a plugin.** The plugin does not run for a route registered before it that answers the request.
- **`rateLimit()` before `cors()`.** Preflights count against the quota, and the `429` has no `Access-Control-Allow-Origin` header, so the browser hides it from the script.
- **A handler that answers before `logger()`.** The logger does not see the request, so a `429` from an earlier `rateLimit()` is not logged.
- **`decorators()` before the parsers.** `@DBody()`, `@DQuery()`, `@DCookies()` and `@DCookie()` resolve to `undefined` or an empty object.
- **One key passed to `basic()`.** With any of `body`, `cookie` or `query` set, only the keys set to `true` or an options object are registered: `basic({ body: true })` registers no query or cookie parser. See [`@routup/basic`](/basic/).
