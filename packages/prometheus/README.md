<p align="center">
    <img src="./assets/logo.svg" alt="@routup/prometheus logo: a stepped counter line rising across dashed sample markers" width="128" height="128" />
</p>

<h1 align="center">@routup/prometheus</h1>

<p align="center">
    <b>Record request durations and uptime with prom-client and serve them on a Prometheus scrape endpoint.</b><br>
    One <code>app.use()</code> times every request, labels it by method, path and status, and mounts <code>/metrics</code> for you.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/prometheus"><img src="https://img.shields.io/npm/v/@routup/prometheus" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/prometheus/">Docs</a>
</p>

---

## Why @routup/prometheus?

To get HTTP metrics out of a routup app with plain [prom-client](https://www.npmjs.com/package/prom-client), you create a histogram, write a middleware that starts a timer, waits for the downstream response, sets the method, path and status labels, and add a route that serializes the registry with the right content type. This plugin does those steps and leaves prom-client's registry open for your own metrics.

| Concern | Without it (prom-client by hand) | With @routup/prometheus |
|---------|----------------------------------|-------------------------|
| Request timing | Write a middleware that calls `startTimer()` and ends it after `event.next()` | `http_request_duration` histogram (or summary) recorded for every request |
| Labels | Collect `method`, `path` and `status_code` yourself | Set automatically; add static labels or rewrite them with a callback |
| Path cardinality | Map `/users/42` to `/users/:id` in your own code | `normalizePath` hook applied before the label is set |
| Uptime | Define and update a gauge | `http_uptime` gauge, in whole seconds since the plugin was installed |
| Scrape endpoint | Add a route that awaits `registry.metrics()` and sets `Content-Type` | Mounted at `metricsPath` (default `/metrics`) |
| Custom metrics | Register them on a registry you expose yourself | Register them on the same prom-client registry and they appear on the endpoint |

```typescript
import { App, serve } from 'routup';
import { prometheus } from '@routup/prometheus';

const app = new App();

// install first, so every route after it is timed
app.use(prometheus());

serve(app, { port: 3000 });
// GET http://localhost:3000/metrics
```

## Installation

```bash
npm install @routup/prometheus prom-client
```

ESM only, Node.js >=24. Peer dependencies: `routup@^6.3.0` and `prom-client@>=15.0.0`.

## Usage

### Serve the built-in metrics

```typescript
import { App, serve } from 'routup';
import { prometheus } from '@routup/prometheus';

const app = new App();

app.use(prometheus({
    // serve metrics on path /metrics
    metricsPath: '/metrics',
}));

serve(app, { port: 3000 });
```

The metrics can then be inspected on `http://localhost:3000/metrics`, in the Prometheus exposition format.

- Install the plugin **before** any other plugin, middleware or route. Its middleware wraps everything registered after it; requests handled before it are not measured.
- The plugin provides two built-in metrics:

| Metric | Default name | Type | Description |
|--------|--------------|------|-------------|
| `uptime` | `http_uptime` | gauge | Seconds (whole numbers) since the plugin was installed |
| `requestDuration` | `http_request_duration` | histogram or summary | Duration in seconds of each request, labeled with `method`, `path` and `status_code` |

- Turn either one off with `uptime: false` or `requestDuration: false`.

### Choose a histogram or a summary

```typescript
import { App } from 'routup';
import { prometheus } from '@routup/prometheus';

const app = new App();

app.use(prometheus({
    requestDurationType: 'summary',
    requestDurationSummary: {
        percentiles: [0.5, 0.9, 0.99],
    },
}));
```

- `requestDurationType` defaults to `'histogram'` with buckets `[0.003, 0.03, 0.1, 0.3, 1.5, 10]` (seconds).
- With `'summary'`, the percentiles default to `[0.5, 0.75, 0.95, 0.98, 0.99, 0.999]`.
- `requestDurationHistogram` and `requestDurationSummary` are spread into the prom-client configuration after the defaults, so they can override `buckets`, `percentiles`, `help` and the other prom-client fields.

### Control labels and path cardinality

```typescript
import { App } from 'routup';
import { prometheus } from '@routup/prometheus';

const app = new App();

app.use(prometheus({
    // static labels: their names are added to the metric's label set
    requestDurationLabels: { service: 'api' },

    // collapse ids so each user does not get its own time series
    normalizePath: (path) => path.replace(/\/\d+/g, '/:id'),

    // last chance to change label values per request
    requestDurationLabelTransformer: (labels, event) => {
        if (event.method === 'HEAD') {
            labels.method = 'GET';
        }
    },

    // do not time health checks
    skip: (event) => event.path === '/health',
}));
```

- The `path` label is the raw request path (`event.path`, with a leading `/`), not the route pattern. Without `normalizePath`, every distinct URL becomes its own time series.
- The transformer runs after `requestDurationLabels` are merged in. It may only set label names the metric declares (`method`, `path`, `status_code` and the keys of `requestDurationLabels`); prom-client throws on any other name.

### Use a custom registry and default metrics

```typescript
import { Registry } from 'prom-client';
import { App } from 'routup';
import { prometheus } from '@routup/prometheus';

const registry = new Registry();
const app = new App();

app.use(prometheus({
    registry,
    collectDefaultMetrics: { register: registry },
}));
```

- `registry` holds the built-in metrics and is what the scrape endpoint serializes. It defaults to prom-client's global `register`.
- `collectDefaultMetrics` is passed to prom-client's `collectDefaultMetrics()` as is. Set its `register` field to the same registry, otherwise the process metrics land in the global registry.

### Add your own metrics

```typescript
import { Counter } from 'prom-client';
import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

const ordersCreated = new Counter({
    name: 'orders_created_total',
    help: 'Total orders created',
    labelNames: ['region'],
});

const app = new App();

app.use(prometheus({ metricsPath: '/metrics' }));

app.post('/orders', defineCoreHandler(() => {
    // ... business logic ...
    ordersCreated.inc({ region: 'eu' });

    return { ok: true };
}));
```

Any metric registered on the plugin's registry (the global prom-client registry by default) is served on the same endpoint.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `metricsPath` | `string` | `'/metrics'` | Path the scrape endpoint is mounted on |
| `registry` | `Registry` | prom-client's global `register` | Registry the built-in metrics are registered on and the endpoint serializes |
| `collectDefaultMetrics` | `DefaultMetricsCollectorConfiguration` | `undefined` | When set, passed to prom-client's `collectDefaultMetrics()` |
| `uptime` | `boolean` | `true` | Register the uptime gauge |
| `uptimeName` | `string` | `'http_uptime'` | Name of the uptime gauge |
| `uptimeLabels` | `LabelValues<string>` | `undefined` | Accepted by the type but currently not applied to the gauge |
| `requestDuration` | `boolean` | `true` | Register and record the request duration metric |
| `requestDurationName` | `string` | `'http_request_duration'` | Name of the request duration metric |
| `requestDurationType` | `'histogram' \| 'summary'` | `'histogram'` | Metric type for request durations |
| `requestDurationHistogram` | `Partial<HistogramConfiguration>` | `{}` | Extra prom-client histogram configuration, applied over the defaults |
| `requestDurationSummary` | `Partial<SummaryConfiguration>` | `{}` | Extra prom-client summary configuration, applied over the defaults |
| `requestDurationLabels` | `LabelValues<string>` | `undefined` | Static labels added to every observation |
| `requestDurationLabelTransformer` | `(labels, event) => void` | `undefined` | Mutates the label values of each observation |
| `normalizePath` | `(path, event) => string` | `undefined` | Rewrites the `path` label |
| `skip` | `(event) => boolean` | `() => false` | Return `true` to leave a request unmeasured |

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `prometheus(options?)` | function (default export) | Plugin factory: registers the metrics, the timing middleware and the scrape endpoint |
| `createHandler(registry?)` | function | Handler that responds with `registry.metrics()` and the registry's content type |
| `registerMetrics(app, options)` | function | Creates the built-in metrics and mounts the timing middleware; returns them as `Metrics` |
| `buildOptions(input?)` | function | Applies the defaults to an options input |
| `MetricName` | enum | Default metric names: `REQUEST_DURATION`, `UPTIME` |
| `MetricTypeName` | enum | `HISTOGRAM`, `SUMMARY` |
| `Options`, `OptionsInput` | type | Resolved and partial plugin options |
| `Metrics` | type | `{ uptime?: Gauge, requestDuration?: Summary \| Histogram }` |
| `LabelTransformer` | type | Signature of `requestDurationLabelTransformer` |

### `createHandler`

Serve a registry on a path of your choice without the timing middleware, for example on a separate internal app:

```typescript
import { Registry } from 'prom-client';
import { App } from 'routup';
import { createHandler } from '@routup/prometheus';

const registry = new Registry();
const internal = new App();

internal.use('/metrics', createHandler(registry));
```

Without an argument it serves prom-client's global registry.

## Notes

- **Order matters.** The timing middleware only wraps what is registered after the plugin.
- **The scrape endpoint is a prefix mount.** It is registered with `app.use(metricsPath, ...)`, so it answers any method and any sub-path (`POST /metrics`, `/metrics/x`). Requests to it are timed like any other request.
- **Status codes need an error handler.** The `status_code` label comes from the response the downstream chain returns. When a handler throws and no error handler answers, or no route matches, the plugin sees no response and records `200`. Register a `defineErrorHandler()` to get the real status.
- **Metric names are global per registry.** Installing the plugin twice on the same registry (for example two apps on prom-client's global registry in one process, or in tests) makes prom-client throw because the metric names already exist. Pass a fresh `Registry` per app.
- **Unknown labels break responses.** Setting a label in `requestDurationLabelTransformer` that the metric does not declare makes prom-client throw while the request is being recorded.
- **Uptime starts at install time**, not at process start, and is truncated to whole seconds.

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
