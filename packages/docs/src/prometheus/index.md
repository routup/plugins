---
title: Prometheus
description: Collect HTTP metrics and expose a Prometheus scrape endpoint.
relatedPlugins: []
---

# @routup/prometheus

Collects standard HTTP metrics for every request and exposes them on a configurable scrape path. Built on [prom-client](https://www.npmjs.com/package/prom-client), so any custom metric you register with `prom-client` is exported alongside the built-ins.

## Built-in metrics

| Metric | Type | Description |
|---|---|---|
| `uptime` | gauge | Total uptime (seconds) of the HTTP server |
| `requestDuration` | histogram | Per-request duration with method, path, and status labels |

## Installation

```bash
npm install @routup/prometheus
```

## Quick start

```typescript
import { App, serve } from 'routup';
import { prometheus } from '@routup/prometheus';

const router = new App();

router.use(prometheus({
    metricsPath: '/metrics',
}));

serve(router, { port: 3000 });
```

Scrape `http://localhost:3000/metrics` — Prometheus exposition format.

::: tip
**Install the plugin first**, before any other middleware or routes you want to measure. The `requestDuration` histogram captures end-to-end timings, so it needs to wrap everything downstream.
:::

## See also

- [Configuration](./configuration) — `metricsPath` plus exposing custom prom-client metrics
