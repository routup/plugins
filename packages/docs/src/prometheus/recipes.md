---
title: Prometheus Recipes
description: Task-oriented samples for the prometheus plugin.
relatedPlugins: []
---

# Recipes

## Labels and Cardinality

Every distinct label set is a time series in Prometheus. This setup adds a static `service` label, counts `HEAD` as `GET`, puts all requests without a route into one series and leaves health checks out.

<<< @/../examples/prometheus/labels.ts

```bash
curl -I http://localhost:3000/users/1
curl http://localhost:3000/nope
curl http://localhost:3000/health
curl -s http://localhost:3000/metrics | grep _count
# http_request_duration_count{status_code="200",method="GET",path="/users/:id",service="api"} 1
# http_request_duration_count{status_code="404",method="GET",path="<unmatched>",service="api"} 1
```

## Histogram Buckets

The default buckets reach from 3 ms to 10 s. Buckets close to your latency targets make the quantiles that Prometheus estimates from them more precise.

<<< @/../examples/prometheus/buckets.ts

```bash
curl -s http://localhost:3000/metrics | grep _bucket
# http_request_duration_bucket{le="0.005",status_code="200",method="GET",path="/"} 1
# http_request_duration_bucket{le="0.01",status_code="200",method="GET",path="/"} 1
# ...
# http_request_duration_bucket{le="+Inf",status_code="200",method="GET",path="/"} 1
```

For quantiles computed in the process instead, use a [summary](/prometheus/configuration#requestdurationtype).

## Protect the Metrics Route

The endpoint is public by default. A handler mounted at the same path before the plugin runs first and can reject the scrape; mounted with `use()`, it also covers every path below `/metrics`, as the endpoint does.

<<< @/../examples/prometheus/protect.ts

```bash
curl -i http://localhost:3000/metrics
# HTTP/1.1 401 Unauthorized
curl -H "authorization: Bearer $METRICS_TOKEN" http://localhost:3000/metrics
# # HELP http_uptime ...
```

In the Prometheus scrape configuration, pass the token with `authorization: { credentials: ... }`. A rejected scrape is answered before the timing handler, so it is not recorded.

## Metrics on an Internal App

Instead of guarding the route, keep it off the public app: `registerMetrics()` times the public app without mounting an endpoint, and `createHandler()` serves the same registry on a second app.

<<< @/../examples/prometheus/internal-app.ts

```typescript
import { serve } from 'routup';
import { app, internal } from './internal-app';

serve(app, { port: 3000 });
serve(internal, { port: 9100 });
```

```bash
curl -i http://localhost:3000/metrics
# HTTP/1.1 404 Not Found
curl http://localhost:9100/metrics
# # HELP http_uptime ...
```

## Your Own Metrics

A metric registered on the plugin's registry is served on the same endpoint.

<<< @/../examples/prometheus/custom-metrics.ts

```bash
curl -X POST http://localhost:3000/orders
curl -s http://localhost:3000/metrics | grep orders_created
# # HELP orders_created_total Total orders created
# # TYPE orders_created_total counter
# orders_created_total{region="eu"} 1
```

Without `registers`, prom-client puts a metric on the global `register`, which the plugin serves when no `registry` is given.
