# @routup/cors

[![npm version](https://badge.fury.io/js/@routup%2Fcors.svg)](https://badge.fury.io/js/@routup%2Fcors)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

A native CORS plugin for routup — handles preflight (`OPTIONS`) requests and adds `Access-Control-*` response headers without going through `fromNodeMiddleware`.

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
| `origin` | `'*' \| 'null' \| (string \| RegExp)[] \| (origin) => boolean` | `'*'` | Value of `Access-Control-Allow-Origin`. Arrays / RegExp / functions match against the request `Origin`. |
| `methods` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Allow-Methods` on preflight. |
| `allowHeaders` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Allow-Headers` on preflight. When `'*'` or empty, mirrors the request's `Access-Control-Request-Headers`. |
| `exposeHeaders` | `'*' \| string[]` | `'*'` | Value of `Access-Control-Expose-Headers`. |
| `credentials` | `boolean` | `false` | Sets `Access-Control-Allow-Credentials: true`. With credentials, none of `origin` / `methods` / `allowHeaders` / `exposeHeaders` may be `'*'` — browsers will reject the response. |
| `maxAge` | `string \| false` | `false` | Value of `Access-Control-Max-Age` on preflight. |
| `preflight.statusCode` | `number` | `204` | Status code returned for preflight responses. |

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

Appends the preflight set (`Allow-Methods`, `Allow-Headers`, `Max-Age`, etc.) to `event.response.headers`. Caller is responsible for returning a `Response`.

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
