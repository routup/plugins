---
title: Rate-limit
description: Per-client request quotas with pluggable stores.
relatedPlugins: [rate-limit-redis]
---

# @routup/rate-limit

A rate-limiter middleware. Counts requests per client (default: by IP) within a sliding window and rejects further requests once the limit is reached. Pluggable storage — defaults to in-memory; swap in [`@routup/rate-limit-redis`](/rate-limit-redis/) for distributed deployments.

## Installation

```bash
npm install @routup/rate-limit
```

## Quick start

```typescript
import { Router, serve } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const router = new Router();

router.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                 // per IP, per window
}));

serve(router, { port: 3000 });
```

When a client exceeds 100 requests in the window, the plugin responds `429 Too Many Requests` with a `Retry-After` header.

## When to use it

- Protecting login / signup / password-reset endpoints from brute force
- Stopping abusive scraping or accidental client loops
- Tiered quotas (different limits for premium vs free) — see the [`max` callback pattern](./configuration#max)

## Stores

The default in-memory store is fine for a single Node process. For multiple processes (a load-balanced API, a Kubernetes deployment, a Cloudflare Worker), share state via:

- [`@routup/rate-limit-redis`](/rate-limit-redis/) — Redis-backed counters

To write your own backend, implement the `Store` interface (`incrementClientHit`, `decrementClientHit`, `resetAllClients`, `resetClient`).

## See also

- [Configuration](./configuration) — every option in detail (`windowMs`, `max`, `keyGenerator`, `skip`, `handler`, …)
- [`@routup/rate-limit-redis`](/rate-limit-redis/) — production-ready distributed store
