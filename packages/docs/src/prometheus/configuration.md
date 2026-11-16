---
title: Prometheus — Configuration
description: metricsPath, the path label, custom registries, and prom-client interop.
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

## Path label

The `path` label of `requestDuration` is the pattern of the route that handled the request (`event.route.path`), composed over every mount: `GET /api/users/42` on `users.get('/:id', ...)` mounted at `/api/users` is labelled `/api/users/:id`. Each route is one time series, without a hand-written normaliser.

::: warning Changed default
A request handled by a method-bound route is labelled with the route's pattern where it was the concrete URL. This bounds the label's cardinality; dashboards or alerts that match concrete paths need the pattern instead. To keep the concrete URL, set `normalizePath: (path) => path`.
:::

A request no method-bound route handled (a 404, a request only middleware or a method-less mount answered, an `OPTIONS` request answered without a route) has no pattern. It is labelled with `unmatchedPath` when set, else with its raw path.

The label is resolved after the handlers ran. A method-bound route that passed on with `event.next()` (a guard such as `router.get('/admin/*rest', guard)`) still names the route when nothing after it answers, so such a 404 is labelled with the guard's pattern.

### `unmatchedPath`

- **Type**: `string`
- **Default**: `undefined`

The fixed `path` label of a request no method-bound route handled. Leaving it unset keeps one time series per distinct unmatched URL, so set it when the app is reachable by arbitrary paths:

```typescript
router.use(prometheus({ unmatchedPath: '<unmatched>' }));
```

### `normalizePath`

- **Type**: `(path: string, event: IAppEvent) => string`
- **Default**: `undefined`

Computes the `path` label itself and wins over the route pattern and `unmatchedPath`. It gets the raw request path and the event; `event.route` is readable inside it:

```typescript
router.use(prometheus({
    normalizePath: (path, event) => event.route?.path ?? '/other',
}));
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
