---
title: Rate-limit Redis
description: Distributed Redis-backed counter store for @routup/rate-limit.
relatedPlugins: [rate-limit]
plugin:
    package: '@routup/rate-limit-redis'
    summary: 'Redis store for rate-limit.'
    group: 'Operations'
    order: 4
---

# @routup/rate-limit-redis

A store for [`@routup/rate-limit`](/rate-limit/) that keeps the hit counters in Redis, so every instance behind a load balancer counts against the same quota and a restart keeps the counters. It talks to Redis through an [ioredis](https://github.com/redis/ioredis) client created with [redis-extension](https://www.npmjs.com/package/redis-extension).

## Requirements

- Node.js 24 or later (also required by `redis-extension`), ESM only
- `routup` `^6.3.0` (peer dependency)
- `@routup/rate-limit` `^4.0.3` (peer dependency): the limiter this store plugs into
- `redis-extension` `^3.0.0` (peer dependency): `package.json` marks it optional, but the store imports it when the module loads, so install it
- `ioredis` `^6` (peer dependency of `redis-extension`)
- A Redis server

## Installation

```bash
npm install @routup/rate-limit-redis @routup/rate-limit redis-extension ioredis
```

## Quick Start

<<< @/../examples/rate-limit-redis/quick-start.ts

Pass the store as the [`store`](/rate-limit/configuration#store) option of `rateLimit()`; every other option, such as `windowMs`, `max` or `keyGenerator`, belongs to the limiter ([Configuration](/rate-limit/configuration)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

The samples on this page need a running Redis. They are type-checked; the tests run them against an in-memory stand-in for the redis-extension client, which pins the key format, the TTL and the reset behaviour described here.

## Connecting to Redis

`new RedisStore(input?)` takes one argument:

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `input` | `string \| Client` | none | A Redis URL: the store creates its own client with `createClient({ url })`. A `Client` (an ioredis `Redis` instance, for example from redis-extension's `createClient()`): the store uses it. Nothing or `undefined`, for example an unset environment variable: the store creates a client for `localhost:6379` |

The client is created in the constructor, and ioredis connects when it is created unless `lazyConnect` is set. The store never closes it; call `store.client.quit()` on shutdown.

<<< @/../examples/rate-limit-redis/connect-url.ts

To share the client the rest of your app uses, pass it in:

<<< @/../examples/rate-limit-redis/shared-client.ts

## Default Behaviour

| Step | What happens |
|------|--------------|
| Key | The limiter's key (by default the client IP) is stored as `rate-limit:<key>` |
| Count | `increment()` reads the counter with `GET`, adds 1 and writes it with `SET ... PX windowMs` |
| Expiry | Every hit writes the key again with a TTL of `windowMs`, so the TTL starts over on each hit |
| Reset time | The `resetTime` returned to the limiter is now plus `windowMs` on every hit, so `RateLimit-Reset` always shows the full window |
| Undo | `decrement()`, called by the limiter for `skipFailedRequest` or `skipSuccessfulRequest`, subtracts 1 and writes the key with a fresh TTL; a missing key is left alone |
| Reset | `reset()` deletes the key. The limiter never calls it; call it yourself ([Reset After a Successful Login](#reset-after-a-successful-login)) |

`windowMs` comes from the limiter: `rateLimit()` calls `init()` with its resolved options when it is called, so give each limiter its own store instance.

- **The window slides.** A client that sends at least one request per `windowMs` never sees its counter expire and stays rejected until it pauses for a full window. The default `MemoryStore` instead clears all counters together every `windowMs`.
- **Increments are not atomic.** `GET` and `SET` are two commands, not `INCR`. Concurrent requests for the same key, from one instance or several, can read the same value and count one hit too few.
- **`decrement()` does not wait for Redis.** Its `SET` is not awaited, so an error there is not reported to the limiter.
- **Redis errors fail the request.** When `GET` or `SET` in `increment()` fails, for example because Redis is unreachable and ioredis gives up, the error leaves the limiter and the request is answered with `500`; it is not let through.

## `RedisStore`

The store class. It is also the default export.

```typescript
declare class RedisStore implements Store {
    constructor(input?: string | Client);
}
```

| Member | Description |
|--------|-------------|
| `client` | The ioredis client in use |
| `options` | The limiter options passed to `init()` |
| `init(options)` | Called by `rateLimit()`; keeps the options |
| `increment(key)` | Adds 1 to the counter; returns `{ totalHits, resetTime }` |
| `decrement(key)` | Subtracts 1 from an existing counter |
| `reset(key)` | Deletes the counter |
| `buildKey(key)` | Protected; returns `rate-limit:<key>` |

`Store` is the interface of [`@routup/rate-limit`](/rate-limit/helpers#store), `Client` the ioredis client type that `redis-extension` exports.

## Recipes

### Separate Counters per Limiter

Two limiters on the same Redis share the key `rate-limit:<ip>` and would count each other's hits. A subclass that overrides `buildKey()` gives one of them its own keys.

<<< @/../examples/rate-limit-redis/key-prefix.ts

A `POST /login` counts once under `rate-limit:<ip>` and once under `rate-limit:login:<ip>`; a `GET /` counts only under `rate-limit:<ip>`.

### Reset After a Successful Login

The login limiter counts every attempt. After a correct password the route deletes the counter of the client, so its earlier failed attempts no longer count. The route builds the key with the same function as the limiter.

<<< @/../examples/rate-limit-redis/reset-after-login.ts

## Next Steps

- [`@routup/rate-limit`](/rate-limit/): the limiter, its options and response headers
- [Custom Store](/rate-limit/recipes#custom-store): the `Store` contract this class implements
- [Combining Plugins](/guide/combining): the limiter with a shared store next to other plugins
