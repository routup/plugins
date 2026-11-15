<p align="center">
    <img src="./assets/logo.svg" alt="@routup/rate-limit-redis logo: a round limit sign showing 429 above a database cylinder" width="128" height="128" />
</p>

<h1 align="center">@routup/rate-limit-redis</h1>

<p align="center">
    <b>Share @routup/rate-limit hit counters across processes and instances by storing them in Redis.</b><br>
    Pass <code>new RedisStore()</code> as the <code>store</code> option and every instance behind your load balancer counts against the same quota.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/rate-limit-redis"><img src="https://img.shields.io/npm/v/@routup/rate-limit-redis" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/rate-limit-redis/">Docs</a>
</p>

---

## Why @routup/rate-limit-redis?

The default `MemoryStore` of [`@routup/rate-limit`](https://www.npmjs.com/package/@routup/rate-limit) keeps counters inside one process. Run three instances and a client gets three times the quota, and a restart forgets every counter. `RedisStore` keeps the counters in Redis, through a [redis-extension](https://www.npmjs.com/package/redis-extension) (ioredis) client, so all instances read and write the same keys.

| Concern | `MemoryStore` | `RedisStore` |
|---------|---------------|--------------|
| Where counters live | A plain object in the process | Redis keys `rate-limit:<key>` |
| Several instances | Each instance counts on its own | All instances share one counter per key |
| Restart | Counters are lost | Counters survive until their TTL expires |
| Expiry | All counters cleared together every `windowMs` | Each key has a TTL of `windowMs`, renewed on every hit |
| Extra infrastructure | None | A Redis server |

```typescript
import { App, serve } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

const app = new App();

// Apply the rate limiting middleware to API calls only
app.use('/api', rateLimit({
    // 15 minutes
    windowMs: 15 * 60 * 1000,

    // Limit each IP to 100 requests
    // per `window` (here, per 15 minutes)
    max: 100,

    // uses redis-extension's default client,
    // or pass a connection string: new RedisStore('redis://...')
    store: new RedisStore(),
}));

serve(app, { port: 3000 });
```

## Installation

```bash
npm install @routup/rate-limit-redis @routup/rate-limit redis-extension
```

ESM only, Node.js >=22. Peer dependencies: `routup@^6.1.0`, `@routup/rate-limit@^4.0.2` and `redis-extension@^2.0.4` (marked optional in `package.json`, but the store imports it, so install it). `redis-extension` brings `ioredis`.

## Usage

All limiter options (`windowMs`, `max`, `keyGenerator`, `skip`, `handler`, ...) belong to `@routup/rate-limit`; see its [options reference](https://github.com/routup/plugins/tree/master/packages/rate-limit#options). This package only provides the `store`.

### Connect with a connection string

```typescript
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

const limiter = rateLimit({
    store: new RedisStore('redis://user:pass@localhost:6379/0'),
});
```

With a connection string, the store creates its own ioredis client (`new Redis(connectionString)`).

### Share the default redis-extension client

```typescript
import { Redis } from 'ioredis';
import { setClient } from 'redis-extension';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

declare const redisUrl: string;

// register the client your app already uses
setClient(new Redis(redisUrl));

const limiter = rateLimit({
    // must be created after setClient()
    store: new RedisStore(),
});
```

- Without an argument, the constructor calls redis-extension's `useClient()`: it returns the client registered with `setClient()`, or creates one from the config set with `setConfig()`, or, with neither, connects to `localhost:6379`.
- The client is resolved in the constructor, so call `setClient()` or `setConfig()` before `new RedisStore()`.
- The constructor does not accept an ioredis instance; share one through `setClient()` as above.

### Change the key prefix

```typescript
import { RedisStore } from '@routup/rate-limit-redis';

class LoginStore extends RedisStore {
    protected override buildKey(key: string) {
        return `rate-limit:login:${key}`;
    }
}
```

Keys are `rate-limit:<key>` by default, where `<key>` is the result of the limiter's `keyGenerator`. Override the protected `buildKey()` to give two limiters on the same Redis separate counters.

## Options

`new RedisStore(connectionString?)`

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `connectionString` | `string` | `undefined` | Redis URL for a dedicated client. When omitted, redis-extension's `useClient()` supplies the client |

The window length comes from the limiter: `init()` receives the `@routup/rate-limit` options and the store uses their `windowMs` as the key TTL.

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `RedisStore` | class (also the default export) | `Store` implementation for `@routup/rate-limit` backed by Redis |

### `RedisStore`

| Member | Description |
|--------|-------------|
| `client` | The ioredis client in use |
| `options` | The limiter options passed to `init()` |
| `init(options)` | Called by the limiter; stores the options |
| `increment(key)` | Reads the counter, adds 1, writes it back with `PX windowMs`; returns `{ totalHits, resetTime }` with `resetTime` = now + `windowMs` |
| `decrement(key)` | Subtracts 1 and writes it back with a fresh TTL; does nothing when the key does not exist |
| `reset(key)` | Deletes the key. Not called by the limiter; call it yourself, for example after a successful login |
| `buildKey(key)` | Protected; returns `rate-limit:<key>` |

## Notes

- **The TTL is renewed on every hit.** Each increment writes the key with `PX windowMs`, so a client that keeps sending requests at least once per window never sees its counter expire and stays blocked until it pauses for a full `windowMs`. This differs from the fixed window of `MemoryStore`.
- **Increments are not atomic.** The store does `GET` then `SET`, not `INCR`. Concurrent requests for the same key, from one instance or several, can read the same value and undercount.
- **`decrement()` does not wait for Redis.** The `SET` is not awaited, so a Redis error there is not reported to the limiter.
- **Redis errors reject the request.** When `increment()` fails (for example Redis is down), the error propagates out of the middleware; the request is not let through.
- **Connection lifetime is yours.** The store never closes its client. Call `quit()` on `store.client` (or redis-extension's `unsetClient()`) on shutdown.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).

This library is heavily inspired by
[express-rate-limit-redis](https://www.npmjs.com/package/express-rate-limit-redis).
