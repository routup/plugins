<div align="center">

<img src="./assets/logo.svg" alt="@routup/rate-limit logo: a round limit sign showing 429 above a row of five dots" width="128" height="128" />

<h1>@routup/rate-limit</h1>

</div>

[![npm version](https://img.shields.io/npm/v/@routup/rate-limit)](https://www.npmjs.com/package/@routup/rate-limit)
[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)

**Limit how many requests each client can make per time window, with RateLimit headers and pluggable stores.**

You set a window and a quota; the middleware counts hits per client, sets the headers and answers `429` once the quota is used up.

[Docs](https://plugins.routup.dev/rate-limit/) · [Configuration](https://plugins.routup.dev/rate-limit/configuration) · [Helpers](https://plugins.routup.dev/rate-limit/helpers) · [Recipes](https://plugins.routup.dev/rate-limit/recipes)

---

## Why @routup/rate-limit?

A login form, a password reset or a public API needs a cap on how often one client can call it. Doing it by hand means a counter keyed by IP, a timer to reset it, the `RateLimit-*` and `Retry-After` headers, and the decision whether failed or successful requests count. This middleware does that, and lets you move the counters to Redis when you run more than one process.

| Concern | Without it | With @routup/rate-limit |
|---------|------------|-------------------------|
| Counting | A `Map` of hits per IP plus a reset timer | `MemoryStore` counts per key and resets every `windowMs` |
| Client identity | Read `X-Forwarded-For` or the socket address yourself | `getRequestIP(event, { trustProxy })` by default, with the trusted proxies set by `trustProxy`, replaceable with `keyGenerator` |
| Headers | Compute and set limit, remaining and reset values | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` when blocked |
| Rejection | Return a status and body in every guarded route | `statusCode` (`429`) and `message`, or your own `handler` |
| Which requests count | Undo the counter after the response | `skipFailedRequest`, `skipSuccessfulRequest`, `requestWasSuccessful` |
| Multiple instances | Share the counter yourself | Swap in a `Store`, such as [`@routup/rate-limit-redis`](https://www.npmjs.com/package/@routup/rate-limit-redis) |

## Installation

```bash
npm install @routup/rate-limit
```

ESM only, Node.js >=24. Peer dependency: `routup@^6.3.0`.

## Quick Start

```typescript
import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';

export const app = new App();

// 100 requests per client every 15 minutes
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
```

The sample exports the app; [serve it](https://routup.dev/guide/quickstart) from your entry file. `rateLimit()` returns a routup handler: mount it with `app.use()` before the routes it guards. Each counted response carries `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`; the 101st request in the window gets `429` with `Retry-After`.

## Documentation

The full reference lives on [plugins.routup.dev](https://plugins.routup.dev/rate-limit/):

- [Overview](https://plugins.routup.dev/rate-limit/): requirements, default behaviour and the response headers
- [Configuration](https://plugins.routup.dev/rate-limit/configuration): every option, with its type and default
- [Helpers](https://plugins.routup.dev/rate-limit/helpers): `useRequestRateLimitInfo()`, `MemoryStore`, the `Store` interface and the types
- [Recipes](https://plugins.routup.dev/rate-limit/recipes): limit one path, tiered quotas, count only failed requests, a custom store

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).

This library is heavily inspired by
[express-rate-limit](https://www.npmjs.com/package/express-rate-limit).
