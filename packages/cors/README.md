# @routup/cors

[![npm version](https://badge.fury.io/js/@routup%2Fcors.svg)](https://badge.fury.io/js/@routup%2Fcors)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

A CORS plugin for routup — handles preflight (`OPTIONS`) requests and adds `Access-Control-*` response headers.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Options](#options)
- [Helpers](#helpers)
  - [handleCors](#handlecors)
  - [appendCorsHeaders](#appendcorsheaders)
  - [appendCorsPreflightHeaders](#appendcorspreflightheaders)
  - [isPreflightRequest](#ispreflightrequest)
  - [isCorsOriginAllowed](#iscorsoriginallowed)
- [License](#license)

## Installation

```bash
npm install @routup/cors --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

Mount the plugin once at the top of the router. It both adds CORS headers to ordinary responses and short-circuits preflight `OPTIONS` requests with a 204.

```typescript
import { Router, defineCoreHandler, serve } from 'routup';
import { cors } from '@routup/cors';

const router = new Router();

router.use(cors({
    origin: ['https://app.example.com'],
    credentials: true,
    allowHeaders: ['content-type', 'authorization'],
}));

router.get('/', defineCoreHandler(() => 'ok'));

serve(router, { port: 3000 });
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `origin` | `boolean \| string \| RegExp \| (string \| RegExp)[] \| (origin) => boolean` | `'*'` | Value of `Access-Control-Allow-Origin`. `true` reflects the request origin (credentials-friendly); `false` skips CORS entirely. A bare string is emitted verbatim (`'*'`, `'null'`, or any concrete origin). A RegExp / array / function reflects the request origin on match. |
| `methods` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Allow-Methods` on preflight. |
| `allowHeaders` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Allow-Headers` on preflight. When `'*'` or empty, mirrors the request's `Access-Control-Request-Headers`. |
| `exposeHeaders` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Expose-Headers`. |
| `credentials` | `boolean` | `false` | Sets `Access-Control-Allow-Credentials: true`. With credentials, the browser treats a literal `'*'` as a non-wildcard value: a `'*'` `origin` or `methods` causes the request to be blocked, and `'*'` `exposeHeaders` silently hides custom response headers from JavaScript. Use `origin: true` to reflect the request origin (credentials-safe), enumerate `methods` explicitly, and list the response headers you want exposed. `allowHeaders: '*'` is fine — the plugin mirrors `Access-Control-Request-Headers` so `*` never appears on the wire. |
| `maxAge` | `string \| number \| false` | `false` | Value of `Access-Control-Max-Age` on preflight, in seconds. Numbers are stringified. |
| `preflight.continue` | `boolean` | `false` | When `true`, sets the preflight headers and calls `event.next()` instead of returning a 204 — lets your own `OPTIONS` handler take over. |
| `preflight.status` | `number` | `204` | Status code returned for preflight responses. Preflight responses also set `Content-Length: 0` for Safari compatibility. |

## Helpers

### `handleCors`

All-in-one helper: appends headers and, on a preflight request, returns the preflight `Response`. Useful inside an existing handler when you don't want to install the plugin globally.

```typescript
declare function handleCors(
    event: IRoutupEvent,
    options: Options,
): Response | undefined;
```

```typescript
router.all('/', defineCoreHandler((event) => {
    const corsResponse = handleCors(event, { origin: '*' });
    if (corsResponse) {
        return corsResponse;
    }
    // your handler logic
    return 'ok';
}));
```

### `appendCorsHeaders`

Appends the standard `Access-Control-Allow-*` and `Access-Control-Expose-Headers` to the current response. No-op on preflight detection — pair with `appendCorsPreflightHeaders` if you handle preflight yourself.

```typescript
declare function appendCorsHeaders(
    event: IRoutupEvent,
    options: Options,
): void;
```

### `appendCorsPreflightHeaders`

Appends the preflight set (`Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age`, etc.) to `event.response.headers`. Caller is responsible for returning a `Response`.

```typescript
declare function appendCorsPreflightHeaders(
    event: IRoutupEvent,
    options: Options,
): void;
```

### `isPreflightRequest`

Returns `true` when the request is `OPTIONS` with both an `Origin` header and an `Access-Control-Request-Method` header.

```typescript
declare function isPreflightRequest(event: IRoutupEvent): boolean;
```

### `isCorsOriginAllowed`

Pure helper that evaluates the `origin` option against an origin string. Useful for custom decisions outside the plugin.

```typescript
declare function isCorsOriginAllowed(
    origin: string | null | undefined,
    options: Options,
): boolean;
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
