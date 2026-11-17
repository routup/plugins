---
title: Rate-limit Recipes
description: Task-oriented samples for the rate-limit middleware.
relatedPlugins: [rate-limit-redis]
---

# Recipes

## Limit One Path

Mounted with a path, the limiter counts only the requests below it, with its own quota; other routes stay unlimited.

<<< @/../examples/rate-limit/limit-path.ts

The sixth login attempt within a minute is rejected:

```bash
curl -i -X POST http://localhost:3000/auth/login
# HTTP/1.1 429 Too Many Requests
# ratelimit-limit: 5
# ratelimit-remaining: 0
# retry-after: 60
#
# Too many requests, please try again later.
```

## Tiered Quota

A `max` function returns the quota per request. Here API keys from a premium list get twice the default, and the key also identifies the client.

<<< @/../examples/rate-limit/tiered-quota.ts

```bash
curl -i -H 'x-api-key: premium-key' http://localhost:3000/
# ratelimit-limit: 10
curl -i -H 'x-api-key: free-key' http://localhost:3000/
# ratelimit-limit: 5
```

## Count Only Failed Requests

With `skipSuccessfulRequest`, a request that ends below status 400 is uncounted after its response, so only failed logins use up the quota.

<<< @/../examples/rate-limit/failed-only.ts

A successful login is counted and uncounted again, so the quota stays untouched:

```bash
curl -i -X POST -H 'authorization: Bearer valid-token' http://localhost:3000/auth/login
# HTTP/1.1 200 OK
# ratelimit-limit: 5
# ratelimit-remaining: 5
```

After five failed attempts the client is rejected until the window resets, also with the correct token: the request is counted before the route runs.

## Read the Limit State

`useRequestRateLimitInfo()` returns what the middleware counted for the current request.

<<< @/../examples/rate-limit/read-info.ts

```bash
curl http://localhost:3000/quota
# {"limit":100,"remaining":99,"resetTime":"2026-01-01T00:01:00.000Z"}
```

`resetTime` is a `Date`, serialised as an ISO string; the value above is for a limiter started at midnight UTC, since `MemoryStore` windows count from that moment.

## Custom Store

A store implements [`Store`](/rate-limit/helpers#store). This one gives every client its own window, starting with its first request, where `MemoryStore` resets all clients together.

<<< @/../examples/rate-limit/custom-store.ts

`increment()` may return a value or a promise, so the same shape works for a store that talks to a database.
