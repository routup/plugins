<div align="center">

<a href="https://routup.dev"><img src=".github/assets/logo.svg" width="128" height="128" alt="routup plugins logo: the routup R tile with four small plugin tiles docked onto its edges"></a>

<h1>routup plugins</h1>

</div>

[![CI](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

**Official plugins for routup: body, cookie and query parsing, CORS, rate limiting, logging, metrics, static files and more.**

routup keeps its core small. Install only the plugins you need, register them with `app.use()`, and read their results with typed helpers.

[Packages](#packages) · [Quick Start](#quick-start) · [How plugins work](#how-plugins-work) · [Docs](https://plugins.routup.dev) · [routup](https://routup.dev)

---

## Why routup plugins?

[routup](https://github.com/routup/routup) routes requests and builds responses on any runtime (Node.js, Bun, Deno, Cloudflare Workers and more), and it stops there on purpose. Parsing a body, reading cookies, answering CORS preflights or limiting clients is left to you. These packages are that work, done once, tested against a real `App`, and published separately so you install only what you use.

| Concern | Without a plugin | With routup plugins |
|---|---|---|
| **Request body** | Read `event.request`, branch on `content-type`, decode JSON or form data yourself | `readRequestBody(event)` parses JSON and urlencoded bodies by default (text and raw on request), once per request, with an optional size `limit` |
| **Cookies and query** | Split the `cookie` header and parse `?a[b]=1` by hand on every route | `useRequestCookie(event, 'session')` and `useRequestQuery(event)` return parsed values cached on the event; `setResponseCookie()` writes `Set-Cookie` |
| **CORS** | Answer `OPTIONS` preflights and set `Access-Control-*` headers on every response | `cors({ origin, credentials })` answers preflights with `204` and adds the headers to every other response |
| **Abuse protection** | Count requests per client and reject the excess | `rateLimit({ windowMs, max })` answers `429` with rate limit headers; `@routup/rate-limit-redis` shares the counters across instances |
| **Observability** | Time requests and format log lines or metrics yourself | `logger('dev')` prints morgan-style lines; `prometheus()` records request durations and serves `/metrics` |
| **Serving** | Map paths to files, set caching headers, write an OpenAPI UI | `assets('public')` serves a directory with caching and a fallback file; `swaggerUI(document)` mounts Swagger UI |

## Quick Start

```bash
npm install routup @routup/basic @routup/cors @routup/logger @routup/rate-limit
```

```typescript
import { App, defineCoreHandler, serve } from 'routup';
import { basic } from '@routup/basic';
import { readRequestBody } from '@routup/basic/body';
import { useRequestCookie } from '@routup/basic/cookie';
import { useRequestQuery } from '@routup/basic/query';
import { cors } from '@routup/cors';
import { logger } from '@routup/logger';
import { rateLimit } from '@routup/rate-limit';

const app = new App();

app.use(logger('dev'));
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(basic());

app.post('/posts', defineCoreHandler(async (event) => {
    const post = await readRequestBody(event);
    const session = useRequestCookie(event, 'session');
    const { draft } = useRequestQuery(event);

    return {
        post,
        session,
        draft,
    };
}));

serve(app, { port: 3000 });
```

`@routup/basic` installs the body, cookie and query plugins together and depends on all three; its subpaths `@routup/basic/body`, `@routup/basic/cookie` and `@routup/basic/query` re-export their helpers, so the sample needs no further install. Every package is ESM only, needs Node.js 24 or later and has `routup` as a peer dependency; the [Requirements](https://plugins.routup.dev/guide/getting-started#requirements) table lists the range and the further peers of each package.

## How plugins work

<p align="center">
    <img src="./.github/assets/pipeline.svg" alt="A request passes through the handlers registered with app.use in order: logger, cors, rateLimit, basic, then your route handler. Each one calls event.next() to pass the request on and gets the Response back on the way out. cors answers a preflight OPTIONS request with 204 and rateLimit answers with 429 once a client exceeds max requests in windowMs, so the request never reaches later handlers. basic stores the parsed query and cookies on event.store and parses the body on first read; the handler reads them with readRequestBody, useRequestCookie and useRequestQuery. logger prints its line once the Response is back." width="100%" />
</p>

- **Order is `app.use()` order.** Each entry receives the event, may answer on its own, or calls `event.next()` and gets the downstream `Response` back. Register observers such as `logger()` first so they see every request, including the ones `cors()` or `rateLimit()` answer early.
- **Two shapes, one call.** Most packages export a plugin factory (`cors()`, `basic()`, `prometheus()`) that returns a routup `Plugin`; `logger()` and `rateLimit()` return a handler. Both go into `app.use()`, and both can be mounted on a path: `app.use('/api', rateLimit())`.
- **Results live on the event.** Plugins store what they parse in `event.store`, and you read it with `use*`/`read*` helpers (`useRequestQuery`, `readRequestBody`). A helper does not throw when its plugin is missing: `readRequestBody()`, `useRequestCookies()` and `useRequestQuery()` return an empty object, so a forgotten `app.use()` shows up as missing data rather than an error.

## Packages

| Package | Version | Description |
|---|---|---|
| [@routup/assets](https://plugins.routup.dev/assets/) | [![npm](https://img.shields.io/npm/v/@routup/assets)](https://www.npmjs.com/package/@routup/assets) | Serve static files from a directory, with cache headers, SPA fallback and pass-through to the next handler. |
| [@routup/basic](https://plugins.routup.dev/basic/) | [![npm](https://img.shields.io/npm/v/@routup/basic)](https://www.npmjs.com/package/@routup/basic) | Install body, cookie and query parsing in a routup app with one plugin and one dependency. |
| [@routup/body](https://plugins.routup.dev/body/) | [![npm](https://img.shields.io/npm/v/@routup/body)](https://www.npmjs.com/package/@routup/body) | Read the request body of a routup app as parsed JSON or form data, text, bytes, a Blob or a stream. |
| [@routup/cookie](https://plugins.routup.dev/cookie/) | [![npm](https://img.shields.io/npm/v/@routup/cookie)](https://www.npmjs.com/package/@routup/cookie) | Read request cookies and write Set-Cookie headers in a routup app. |
| [@routup/cors](https://plugins.routup.dev/cors/) | [![npm](https://img.shields.io/npm/v/@routup/cors)](https://www.npmjs.com/package/@routup/cors) | Answer CORS preflight requests and add Access-Control-* headers to routup responses. |
| [@routup/decorators](https://plugins.routup.dev/decorators/) | [![npm](https://img.shields.io/npm/v/@routup/decorators)](https://www.npmjs.com/package/@routup/decorators) | Write routup routes as TypeScript classes with method and parameter decorators, and generate OpenAPI from them. |
| [@routup/i18n](https://plugins.routup.dev/i18n/) | [![npm](https://img.shields.io/npm/v/@routup/i18n)](https://www.npmjs.com/package/@routup/i18n) | Pick each request's locale and translate messages with ilingo inside routup handlers. |
| [@routup/logger](https://plugins.routup.dev/logger/) | [![npm](https://img.shields.io/npm/v/@routup/logger)](https://www.npmjs.com/package/@routup/logger) | Log one line per routup request, using morgan's token syntax and its tiny, short, common, combined and dev formats. |
| [@routup/prometheus](https://plugins.routup.dev/prometheus/) | [![npm](https://img.shields.io/npm/v/@routup/prometheus)](https://www.npmjs.com/package/@routup/prometheus) | Record request durations and uptime with prom-client and serve them on a Prometheus scrape endpoint. |
| [@routup/query](https://plugins.routup.dev/query/) | [![npm](https://img.shields.io/npm/v/@routup/query)](https://www.npmjs.com/package/@routup/query) | Parse the query string of a routup request into an object, nested keys and arrays included. |
| [@routup/rate-limit](https://plugins.routup.dev/rate-limit/) | [![npm](https://img.shields.io/npm/v/@routup/rate-limit)](https://www.npmjs.com/package/@routup/rate-limit) | Limit how many requests each client can make per time window, with RateLimit headers and pluggable stores. |
| [@routup/rate-limit-redis](https://plugins.routup.dev/rate-limit-redis/) | [![npm](https://img.shields.io/npm/v/@routup/rate-limit-redis)](https://www.npmjs.com/package/@routup/rate-limit-redis) | Share @routup/rate-limit hit counters across processes and instances by storing them in Redis. |
| [@routup/swagger-ui](https://plugins.routup.dev/swagger-ui/) | [![npm](https://img.shields.io/npm/v/@routup/swagger-ui)](https://www.npmjs.com/package/@routup/swagger-ui) | Serve Swagger UI for an OpenAPI document (file, object or URL) under any path of a routup app. |

Options, helpers and recipes of every package are on the [documentation site](https://plugins.routup.dev), which starts with [Getting Started](https://plugins.routup.dev/guide/getting-started) and [Combining Plugins](https://plugins.routup.dev/guide/combining). Each package README has its pitch and a quick start; the source of a package is under `packages/<name>`. [routup.dev](https://routup.dev) documents routup itself.

## Development

```bash
npm ci            # install all workspaces
npm run build     # build every package (NX, in dependency order)
npm run test      # run all tests with coverage
npm run lint      # ESLint across the packages and the agent docs
```

Node.js 24 or later. Each package lives in `packages/<name>` and builds with tsdown to ESM (`dist/index.mjs` + `dist/index.d.mts`).

## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
