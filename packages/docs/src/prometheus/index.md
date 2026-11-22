---
title: Prometheus
description: Collect HTTP metrics and expose a Prometheus scrape endpoint.
relatedPlugins: []
plugin:
    package: '@routup/prometheus'
    summary: 'Expose Prometheus metrics.'
    group: 'Operations'
    order: 5
---

# @routup/prometheus

Times every request and serves the metrics for Prometheus to scrape. The plugin records a request duration histogram labelled by method, route pattern and status, plus an uptime gauge, on a [prom-client](https://www.npmjs.com/package/prom-client) registry that your own metrics can share.

## Requirements

- Node.js 24 or later, ESM only
- `routup` `^6.4.0` (peer dependency)
- `prom-client` `>=15.0.0` (peer dependency, required: install it next to the plugin)

## Installation

```bash
npm install @routup/prometheus prom-client
```

## Quick Start

<<< @/../examples/prometheus/quick-start.ts

`prometheus()` returns a plugin; register it with `app.use()` before the routes it times ([Plugins](https://routup.dev/guide/plugins)). The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl http://localhost:3000/users/42
curl http://localhost:3000/metrics
# # HELP http_uptime duration (sec) since application is up and running.
# # TYPE http_uptime gauge
# http_uptime 12
# # HELP http_request_duration duration (sec) histogram of http responses labeled with: method, path, status_code
# # TYPE http_request_duration histogram
# http_request_duration_bucket{le="0.003",status_code="200",method="GET",path="/users/:id"} 1
# ...
# http_request_duration_count{status_code="200",method="GET",path="/users/:id"} 1
```

## Default Behaviour

Installing the plugin registers two metrics on prom-client's global `register`, adds a handler that times the requests after it, and serves the registry at `/metrics`.

| Metric | Default name | Type | Value |
|--------|--------------|------|-------|
| `uptime` | `http_uptime` | gauge | Whole seconds since the plugin was installed, not since the process started |
| `requestDuration` | `http_request_duration` | histogram (or summary) | Seconds per request, labelled `method`, `path` and `status_code`; buckets `[0.003, 0.03, 0.1, 0.3, 1.5, 10]` |

### Labels

| Label | Value |
|-------|-------|
| `method` | The request method |
| `path` | The pattern of the route that handled the request, composed over every mount (`/api/users/:id` for `GET /api/users/42`); for a request no method-bound route handled, the raw path or [`unmatchedPath`](/prometheus/configuration#unmatchedpath) |
| `status_code` | The status of the response the handlers after the plugin returned; when they returned none, the status of the response routup builds: `404`, or for an `OPTIONS` request the status of its `Allow` response |

- **Unanswered errors are recorded as `404`.** When a route throws and no [error handler](https://routup.dev/guide/error-handling) answers, routup builds the `500` after the plugin returned and does not tell the plugin about the error, so the request is labelled like a request no route matched: `404`, or for an `OPTIONS` request the status its `Allow` response would have had (normally `200`). Register an error handler after your routes to record the real status of errors.
- **Requests without a route keep their URL.** A request no method-bound route handled, such as a `404`, a request answered by middleware or a method-less mount, or a scrape of `/metrics` itself, is labelled with its raw path: one series per distinct URL. Set [`unmatchedPath`](/prometheus/configuration#unmatchedpath) when the app is reachable by arbitrary paths.
- **Mount order matters.** A request answered by a handler registered before the plugin is not timed.

### Scrape Endpoint

The endpoint is mounted with `app.use(metricsPath, ...)`, so it answers every method and every path below it (`POST /metrics`, `/metrics/x`) with `registry.metrics()` and the registry's `Content-Type`, `text/plain; version=0.0.4; charset=utf-8` for the default registry. It is public; [Protect the Metrics Route](/prometheus/recipes#protect-the-metrics-route) guards it.

## Next Steps

- [Configuration](/prometheus/configuration): every option, the `path` label, registries and default metrics
- [Helpers](/prometheus/helpers): `createHandler()`, `registerMetrics()`, `buildOptions()` and the types
- [Recipes](/prometheus/recipes): labels and cardinality, buckets, protecting the metrics route, an internal metrics app, your own metrics
