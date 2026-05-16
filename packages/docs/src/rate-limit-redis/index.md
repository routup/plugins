---
title: Rate-limit — Redis store
description: Distributed Redis-backed counter store for @routup/rate-limit.
relatedPlugins: [rate-limit]
---

# @routup/rate-limit-redis

Redis adapter for [`@routup/rate-limit`](/rate-limit/). Replace the default in-memory `Store` with `RedisStore` to share counters across processes — necessary for any multi-instance deployment.

## Installation

```bash
npm install @routup/rate-limit-redis @routup/rate-limit
```

## Quick start

```typescript
import { App, serve } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

const router = new App();

router.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    store: new RedisStore(),
}));

serve(router, { port: 3000 });
```

## Configuring the connection

`RedisStore` accepts an [`ioredis`](https://www.npmjs.com/package/ioredis) connection string or an existing instance:

```typescript
new RedisStore('redis://user:pass@host:6379/0');

// or share a connection with the rest of your app
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);
new RedisStore(redis);
```

## When to use it

- Multi-instance API behind a load balancer — without a shared store, each instance keeps its own counters and limits leak by `instanceCount`
- Kubernetes / autoscaling deployments
- Cloudflare Workers + Redis (e.g. Upstash) — Redis as the single source of truth across edge locations

## See also

- [`@routup/rate-limit`](/rate-limit/) — the rate-limiter itself
- [Rate-limit configuration](/rate-limit/configuration) — full option reference
