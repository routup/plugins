---
title: Prometheus Helpers
description: The plugin, the handlers behind it, the metric names and the types exported by @routup/prometheus.
relatedPlugins: []
---

# Helpers and API

Everything `@routup/prometheus` exports. Options are on [Configuration](/prometheus/configuration).

## `prometheus()`

Creates the plugin, named `prometheus`. Installing it runs [`registerMetrics()`](#registermetrics) and mounts [`createHandler(registry)`](#createhandler) at `metricsPath`. It is also the default export.

```typescript
declare function prometheus<T extends RegistryContentType = PrometheusContentType>(
    input?: OptionsInput<T>,
): Plugin;
```

The type parameter follows the content type of `registry`, for example an OpenMetrics registry.

## `createHandler()`

Returns a handler that answers with `registry.metrics()` and the registry's content type; without an argument it serves the global `register`. Use it to serve a registry on an app or a path of your choice.

```typescript
declare function createHandler<T extends RegistryContentType = PrometheusContentType>(
    registry?: Registry<T>,
): Handler;
```

## `registerMetrics()`

Creates the built-in metrics on `options.registry`, calls prom-client's `collectDefaultMetrics()` when `options.collectDefaultMetrics` is set, and adds the timing handler to `app` with `app.use()`. It returns the created metrics and mounts no endpoint, so together with `createHandler()` it times one app and serves the metrics on another:

```typescript
declare function registerMetrics<T extends RegistryContentType = PrometheusContentType>(
    app: IApp,
    options: Options<T>,
): Metrics;
```

<<< @/../examples/prometheus/internal-app.ts

It takes the resolved `Options`; build them with `buildOptions()`.

## `buildOptions()`

Applies the defaults ([Configuration](/prometheus/configuration#options)) to an `OptionsInput` and returns `Options`.

```typescript
declare function buildOptions<T extends RegistryContentType = PrometheusContentType>(
    input?: OptionsInput<T>,
): Options<T>;
```

## `MetricName`

The default metric names.

```typescript
declare enum MetricName {
    REQUEST_DURATION = 'http_request_duration',
    UPTIME = 'http_uptime',
}
```

## `MetricTypeName`

The values of `requestDurationType`.

```typescript
declare enum MetricTypeName {
    HISTOGRAM = 'histogram',
    SUMMARY = 'summary',
}
```

## Types

| Type | Definition |
|------|------------|
| `Options` | The resolved options ([Configuration](/prometheus/configuration)); `metricsPath`, `requestDuration`, `requestDurationName`, `requestDurationHistogram`, `requestDurationSummary`, `uptime`, `uptimeName`, `skip` and `registry` are required |
| `OptionsInput` | `Partial<Options>`, the argument of `prometheus()` |
| `Metrics` | `{ uptime?: Gauge; requestDuration?: Summary \| Histogram }`, returned by `registerMetrics()` |
| `LabelTransformer` | `(labels: LabelValues<string>, event: IAppEvent) => void`, the type of `requestDurationLabelTransformer` |
