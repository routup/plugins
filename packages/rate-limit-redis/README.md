<div align="center">

<img src="./assets/logo.svg" alt="@routup/rate-limit-redis logo: a round limit sign showing 429 above a database cylinder" width="128" height="128" />

<h1>@routup/rate-limit-redis</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/rate-limit-redis)](https://www.npmjs.com/package/@routup/rate-limit-redis)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Share @routup/rate-limit hit counters across processes and instances by storing them in Redis.**

Pass `new RedisStore()` as the `store` option and every instance behind your load balancer counts against the same quota.

[Docs](https://plugins.routup.dev/rate-limit-redis/) · [Connecting to Redis](https://plugins.routup.dev/rate-limit-redis/#connecting-to-redis) · [RedisStore](https://plugins.routup.dev/rate-limit-redis/#redisstore) · [Recipes](https://plugins.routup.dev/rate-limit-redis/#recipes)

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

## Installation

```bash
npm install @routup/rate-limit-redis @routup/rate-limit redis-extension ioredis
```

ESM only, Node.js >=24 (required by `redis-extension`). Peer dependencies: `routup@^6.3.0`, `@routup/rate-limit` and `redis-extension@^3.0.0` (marked optional in `package.json`, but the store imports it, so install it). Install `ioredis@^6` as well; it is a peer dependency of `redis-extension`.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

export const app = new App();

// 100 requests per client every 15 minutes, counted in Redis
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    // without an argument: a client for localhost:6379
    store: new RedisStore(),
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. Pass a Redis URL (`new RedisStore('redis://...')`) or an existing ioredis client to connect elsewhere.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/rate-limit-redis/):

- [Overview](https://plugins.routup.dev/rate-limit-redis/): requirements, connecting to Redis, how keys, TTLs and resets work, `RedisStore` and recipes
- [@routup/rate-limit](https://plugins.routup.dev/rate-limit/): the limiter options and response headers

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).

This library is heavily inspired by
[express-rate-limit-redis](https://www.npmjs.com/package/express-rate-limit-redis).
