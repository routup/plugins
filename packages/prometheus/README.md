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
    <a href="https://plugins.routup.dev/prometheus/"><b>Docs</b></a>
    ·
    <a href="https://plugins.routup.dev/prometheus/configuration">Configuration</a>
    ·
    <a href="https://plugins.routup.dev/prometheus/helpers">Helpers</a>
    ·
    <a href="https://plugins.routup.dev/prometheus/recipes">Recipes</a>
</p>

---

## Why @routup/prometheus?

To get HTTP metrics out of a routup app with plain [prom-client](https://www.npmjs.com/package/prom-client), you create a histogram, write a middleware that starts a timer, waits for the downstream response, sets the method, path and status labels, and add a route that serializes the registry with the right content type. This plugin does those steps and leaves prom-client's registry open for your own metrics.

| Concern | Without it (prom-client by hand) | With @routup/prometheus |
|---------|----------------------------------|-------------------------|
| Request timing | Write a middleware that calls `startTimer()` and ends it after `event.next()` | `http_request_duration` histogram (or summary) recorded for every request |
| Labels | Collect `method`, `path` and `status_code` yourself | Set automatically; add static labels or rewrite them with a callback |
| Path cardinality | Map `/users/42` to `/users/:id` in your own code | Labelled by the route pattern (`/users/:id`) by default; `unmatchedPath` and `normalizePath` for the rest |
| Uptime | Define and update a gauge | `http_uptime` gauge, in whole seconds since the plugin was installed |
| Scrape endpoint | Add a route that awaits `registry.metrics()` and sets `Content-Type` | Mounted at `metricsPath` (default `/metrics`) |
| Custom metrics | Register them on a registry you expose yourself | Register them on the same prom-client registry and they appear on the endpoint |

## Installation

```bash
npm install @routup/prometheus prom-client
```

ESM only, Node.js >=24. Peer dependencies: `routup@^6.4.0` and `prom-client@>=15.0.0`, both required.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

export const app = new App();

// first, so every route after it is timed; serves /metrics
app.use(prometheus());

app.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. `prometheus()` returns a plugin: register it with `app.use()` before the routes it times. `GET /metrics` then serves the `http_request_duration` histogram, labelled `path="/users/:id"` for `/users/42`, and the `http_uptime` gauge.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/prometheus/):

- [Overview](https://plugins.routup.dev/prometheus/): requirements, the built-in metrics, the labels and the scrape endpoint
- [Configuration](https://plugins.routup.dev/prometheus/configuration): every option, the `path` label, registries and default metrics
- [Helpers](https://plugins.routup.dev/prometheus/helpers): `createHandler()`, `registerMetrics()`, `buildOptions()` and the types
- [Recipes](https://plugins.routup.dev/prometheus/recipes): labels and cardinality, buckets, protecting the metrics route, an internal metrics app, your own metrics

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).
