---
title: Rate-limit
description: Per-client request quotas with pluggable stores.
relatedPlugins: [rate-limit-redis]
plugin:
    package: '@routup/rate-limit'
    summary: 'Limit requests per client.'
    group: 'Operations'
    order: 3
---

# @routup/rate-limit

Caps how many requests each client can make per time window, for a login form, a password reset or a public API. The middleware counts hits per client, sets the `RateLimit-*` headers and answers `429` once the quota is used up; the counters live in a replaceable store.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.3.0` (peer dependency)

## Installation

```bash
npm install @routup/rate-limit
```

## Quick Start

<<< @/../examples/rate-limit/quick-start.ts

`rateLimit()` returns a routup handler, not a plugin: mount it with `app.use()`, with or without a path, before the routes it guards ([Mounting](https://routup.dev/guide/handlers#mounting)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -i http://localhost:3000/
# HTTP/1.1 200 OK
# ratelimit-limit: 100
# ratelimit-remaining: 99
# ratelimit-reset: 900
```

## Default Behaviour

| Step | What happens |
|------|--------------|
| Skip | `skip(event)` returning `true` passes the request on uncounted and without headers |
| Key | The client key is `getRequestIP(event, { trustProxy: true })`, or `'127.0.0.1'` when there is no address |
| Count | The store increments the key's counter; every request that is not skipped counts, rejected ones too |
| Quota | `max` is read after the increment (default `5` per `windowMs` of one minute) |
| Reject | Once the counter exceeds a `max` other than `0`, `handler` answers (default: status `429`, the `message` text) and the routes behind it do not run |
| Undo | With `skipFailedRequest` or `skipSuccessfulRequest`, the counter is decremented again after the response when the request should not count ([`countAfterResponse`](/rate-limit/configuration#countafterresponse) counts after the response instead) |

The default store, [`MemoryStore`](/rate-limit/helpers#memorystore), keeps the counters in the process and clears them for all clients at once every `windowMs`. To share counters between processes or instances, use a shared store such as [`@routup/rate-limit-redis`](/rate-limit-redis/).

### Response Headers

| Header | Value |
|--------|-------|
| `RateLimit-Limit` | The quota (`max`) for this request |
| `RateLimit-Remaining` | Requests left in the current window, never below `0` |
| `RateLimit-Reset` | Seconds until the store resets the counter (only when the store returns a `resetTime`) |
| `Retry-After` | `windowMs` in seconds, rounded up, only on a rejected request |

`Retry-After` is always the full window, not the time left until the reset; `RateLimit-Reset` carries the time left.

The headers are set on `event.response`, so a route that returns a `Response` object of its own sends none of them, except `RateLimit-Remaining` when `skipFailedRequest` or `skipSuccessfulRequest` uncounts the request.

## Next Steps

- [Configuration](/rate-limit/configuration): every option, with its type and default
- [Helpers](/rate-limit/helpers): `useRequestRateLimitInfo()`, `MemoryStore`, the `Store` interface and the types
- [Recipes](/rate-limit/recipes): limit one path, tiered quotas, count only failed requests, a custom store
- [`@routup/rate-limit-redis`](/rate-limit-redis/): counters in Redis, shared between instances
- [Combining Plugins](/guide/combining#rate-limit-with-a-shared-store): a shared store, and why `cors()` comes before the limiter
