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
    <a href="https://plugins.routup.dev/rate-limit-redis/"><b>Docs</b></a>
    ·
    <a href="https://plugins.routup.dev/rate-limit-redis/#connecting-to-redis">Connecting to Redis</a>
    ·
    <a href="https://plugins.routup.dev/rate-limit-redis/#redisstore">RedisStore</a>
    ·
    <a href="https://plugins.routup.dev/rate-limit-redis/#recipes">Recipes</a>
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
