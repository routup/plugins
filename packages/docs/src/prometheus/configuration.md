---
title: Prometheus Configuration
description: All options of the prometheus plugin, the path label, registries and prom-client interop.
relatedPlugins: []
---

# Configuration

`prometheus(options?)` takes one object; every option is optional. The argument is `OptionsInput` (`Partial<Options>`); [`buildOptions()`](/prometheus/helpers#buildoptions) applies the defaults below.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `metricsPath` | `string` | `'/metrics'` | Path the scrape endpoint is mounted on |
| `registry` | `Registry` | prom-client's global `register` | Registry the built-in metrics are registered on and the endpoint serves |
| `collectDefaultMetrics` | `DefaultMetricsCollectorConfiguration` | none | When set, passed to prom-client's `collectDefaultMetrics()` |
| `uptime` | `boolean` | `true` | Register the uptime gauge |
| `uptimeName` | `string` | `'http_uptime'` | Name of the uptime gauge |
| `uptimeLabels` | `LabelValues<string>` | none | Accepted by the type, but not applied to the gauge |
| `requestDuration` | `boolean` | `true` | Register and record the request duration metric |
| `requestDurationName` | `string` | `'http_request_duration'` | Name of the request duration metric |
| `requestDurationType` | `'histogram' \| 'summary'` | `'histogram'` | Metric type of the request duration |
| `requestDurationHistogram` | `Partial<HistogramConfiguration>` | `{}` | prom-client histogram configuration, applied over the defaults |
| `requestDurationSummary` | `Partial<SummaryConfiguration>` | `{}` | prom-client summary configuration, applied over the defaults |
| `requestDurationLabels` | `LabelValues<string>` | none | Static labels added to every observation |
| `requestDurationLabelTransformer` | `(labels, event) => void` | none | Changes the label values of each observation |
| `normalizePath` | `(path, event) => string` | none | Computes the `path` label; wins over the route pattern and `unmatchedPath` |
| `unmatchedPath` | `string` | none | `path` label of a request no method-bound route handled |
| `skip` | `(event) => boolean` | `() => false` | Return `true` to leave a request untimed |

### `metricsPath`

Where the scrape endpoint is mounted, as a prefix: every method and every path below it is answered ([Scrape Endpoint](/prometheus/#scrape-endpoint)). Change it when `/metrics` collides with a route of yours. There is no option to leave the endpoint out; for metrics on a separate app, see [Metrics on an Internal App](/prometheus/recipes#metrics-on-an-internal-app).

### `registry`

The prom-client registry that holds the built-in metrics and that the endpoint serves, by default the global `register`. Any metric registered on it appears on the endpoint ([Your Own Metrics](/prometheus/recipes#your-own-metrics)). The endpoint sends the registry's content type, so a `Registry<OpenMetricsContentType>` set to `Registry.OPENMETRICS_CONTENT_TYPE` with `setContentType()` serves OpenMetrics.

Metric names are unique per registry: installing the plugin twice on the same registry, for example two apps on the global `register` in one process or in tests, throws at `app.use()` with prom-client's "A metric with the name ... has already been registered". Give each app its own `Registry`.

### `collectDefaultMetrics`

Passed as is to prom-client's [`collectDefaultMetrics()`](https://github.com/siimon/prom-client#default-metrics) for the process and Node.js metrics. Its `register` field decides where they go: set it to the same registry, otherwise they land in the global `register`.

<<< @/../examples/prometheus/default-metrics.ts

### `uptimeLabels`

Typed as an option, but the uptime gauge is created without labels, so the value has no effect.

### `requestDurationType`

`'histogram'` (the default) with buckets `[0.003, 0.03, 0.1, 0.3, 1.5, 10]` seconds, or `'summary'` with the percentiles `[0.5, 0.75, 0.95, 0.98, 0.99, 0.999]`.

<<< @/../examples/prometheus/summary.ts

### `requestDurationHistogram`

Spread into the prom-client `Histogram` configuration after the defaults, so it can replace `buckets`, `help` and the other fields ([Histogram Buckets](/prometheus/recipes#histogram-buckets)). Used only when `requestDurationType` is `'histogram'`.

### `requestDurationSummary`

Spread into the prom-client `Summary` configuration after the defaults, so it can replace `percentiles`, `maxAgeSeconds`, `ageBuckets` and the other fields. Used only when `requestDurationType` is `'summary'`.

### `requestDurationLabels`

Static labels added to every observation; their names are added to the metric's label names. [Labels and Cardinality](/prometheus/recipes#labels-and-cardinality) adds a `service` label.

### `requestDurationLabelTransformer`

Called for each observation after `requestDurationLabels` were merged in, with the label values and the event; change the values in place. It may only set the label names the metric declares, `method`, `path`, `status_code` and the keys of `requestDurationLabels`: any other name makes prom-client throw, and the request fails with `500`.

### `normalizePath`

Computes the `path` label itself, from the raw request path (always with a leading `/`) and the event, and wins over the route pattern and `unmatchedPath`. It runs after the handlers, so `event.route` is readable inside it.

The route pattern is the default label since 4.1.0; earlier versions used the concrete URL. To keep the concrete URL, set `normalizePath: (path) => path`; dashboards and alerts that match concrete paths need one or the other.

### `unmatchedPath`

The `path` label of a request no method-bound route handled: a `404`, a request answered by middleware or by a method-less mount such as `app.use('/static', ...)`, an `OPTIONS` request routup answers itself, and the scrapes of `metricsPath`. Unset, such a request is labelled with its raw path, one time series per distinct URL.

The label is resolved after the handlers ran: a method-bound route that passed on with `event.next()`, such as a guard `app.get('/admin/*rest', guard)`, still names the route when nothing after it answers, so that `404` is labelled `/admin/*rest`.

### `skip`

Return `true` to pass a request on without timing it, for example for health checks. [Labels and Cardinality](/prometheus/recipes#labels-and-cardinality) skips `/health`.
