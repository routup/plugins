---
title: Getting Started
description: Install a routup plugin, register it on an app and choose where it runs.
---

<script setup>
import PluginList from '../.vitepress/components/PluginList.vue';
</script>

# Getting Started

The packages on this site add request parsing, CORS, rate limits, logging, metrics and more to a [routup](https://routup.dev) app. Each one is a separate npm package that you install alone and register with `app.use()`.

## Requirements

The plugins are ESM only and are developed and tested on Node.js 24 or later. Each package has `routup` as a peer dependency; some need further peers.

| Package | `routup` | Other peer dependencies |
|---------|----------|-------------------------|
| [`@routup/assets`](/assets/) | `^6.3.0` | none |
| [`@routup/basic`](/basic/) | `^6.3.0` | none |
| [`@routup/body`](/body/) | `^6.3.0` | none |
| [`@routup/cookie`](/cookie/) | `^6.3.0` | none |
| [`@routup/cors`](/cors/) | `^6.3.0` | none |
| [`@routup/decorators`](/decorators/) | `^6.3.0` | `@trapi/core` `^2.3.0`, `@trapi/metadata` `^2.3.0`, `@trapi/swagger` `^2.3.0` (optional, for OpenAPI generation) |
| [`@routup/i18n`](/i18n/) | `^6.3.0` | `ilingo` `^6.2.1` |
| [`@routup/logger`](/logger/) | `^6.3.0` | none |
| [`@routup/prometheus`](/prometheus/) | `^6.4.0` | `prom-client` `>=15.0.0` |
| [`@routup/query`](/query/) | `^6.3.0` | none |
| [`@routup/rate-limit`](/rate-limit/) | `^6.3.0` | none |
| [`@routup/rate-limit-redis`](/rate-limit-redis/) | `^6.3.0` | `@routup/rate-limit` `^4.0.3`, `redis-extension` `^3.0.0` |
| [`@routup/swagger-ui`](/swagger-ui/) | `^6.3.0` | `@types/swagger-ui-dist` `^3.30.5` |

## Installation

Install `routup` and the plugins you need, here the two of the sample below:

```bash
npm install routup @routup/body @routup/cors
```

## Register Plugins

<<< @/../examples/guide/two-plugins.ts

The file exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file.

```bash
curl -i -X POST http://localhost:3000/echo \
    -H 'origin: https://app.example.com' \
    -H 'content-type: application/json' \
    -d '{"title":"Write docs"}'
# HTTP/1.1 200 OK
# access-control-allow-origin: https://app.example.com
#
# {"title":"Write docs"}
```

`app.use()` also takes a handler: `rateLimit()` and `logger()` return one, and `@routup/rate-limit-redis` exports a store that you pass to `rateLimit()`. What a plugin is, and how to mount one on a path, is described in [Plugins](https://routup.dev/guide/plugins) on routup.dev.

## Order Matters

routup runs the handlers that match a request in the order they were registered ([Registration order](https://routup.dev/guide/custom-router#registration-order)). A plugin installs its handlers at the position of its `app.use()` call, so a route registered before it answers the request before the plugin runs:

<<< @/../examples/guide/order.ts

```bash
curl -X POST http://localhost:3000/before -H 'content-type: application/json' -d '{"title":"Write docs"}'
# {}
curl -X POST http://localhost:3000/after -H 'content-type: application/json' -d '{"title":"Write docs"}'
# {"title":"Write docs"}
```

Register plugins that parse the request or set response headers before the routes that rely on them. [Combining Plugins](/guide/combining) shows a full stack and the ordering pitfalls.

## Plugins

<PluginList />
