---
title: Prometheus — Configuration
description: metricsPath, custom registries, and prom-client interop.
relatedPlugins: []
---

# Configuration

## Options

### `metricsPath`

- **Type**: `string`
- **Default**: `'/metrics'`

The path Prometheus scrapes. Change it if `/metrics` collides with one of your routes, or if you want to mount the endpoint behind a private prefix:

```typescript
router.use(prometheus({ metricsPath: '/internal/metrics' }));
```

## Adding custom metrics

The plugin uses [prom-client](https://www.npmjs.com/package/prom-client)'s default registry. Any metric you register goes onto the same scrape endpoint:

```typescript
import { Counter } from 'prom-client';
import { prometheus } from '@routup/prometheus';

const ordersCreated = new Counter({
    name: 'orders_created_total',
    help: 'Total orders created',
    labelNames: ['region'],
});

router.use(prometheus({ metricsPath: '/metrics' }));

router.post('/orders', defineCoreHandler(async (event) => {
    // ... business logic ...
    ordersCreated.inc({ region: 'eu' });
    return { ok: true };
}));
```

## Ordering note

The plugin's middleware wraps downstream handlers to time them. Mount it **before** any other `router.use(...)` calls and route registrations — otherwise the histogram only sees what's downstream of the plugin's position.
