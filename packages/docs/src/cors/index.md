---
title: CORS
description: Handle preflight requests and add Access-Control-* response headers.
relatedPlugins: [body, cookie]
---

# @routup/cors

CORS plugin for routup — built on Web Standard `Request` / `Response`. Handles preflight (`OPTIONS`) requests and decorates ordinary responses with the right `Access-Control-*` headers.

## Installation

```bash
npm install @routup/cors
```

## Quick start

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

The plugin short-circuits preflight requests with a `204` and adds the right `Access-Control-Allow-*` headers to non-preflight responses.

## When to use it

- Your API is consumed from a browser on a different origin.
- You need precise control over preflight: status code, allow-listed methods/headers, max-age, credentials.

## Options at a glance

| Option | Default | Notes |
|---|---|---|
| `origin` | `'*'` | `true` reflects the request origin (credentials-friendly); `false` skips CORS entirely. Strings (`'*'`, `'null'`, `'https://app.example.com'`), `RegExp`, allow-list arrays, or custom predicates also supported. |
| `methods` | `'*'` | Allowed methods on preflight. Pass `['GET','POST']` for explicit lists. |
| `allowHeaders` | `'*'` | Mirrors `Access-Control-Request-Headers` when `'*'` or empty. |
| `exposeHeaders` | `'*'` | Headers visible to the browser via `getResponseHeader`. |
| `credentials` | `false` | Enable `Access-Control-Allow-Credentials: true`. With credentials, the browser treats a literal `'*'` as non-wildcard: a `'*'` `origin` or `methods` blocks the request, and `'*'` `exposeHeaders` silently hides custom (non-CORS-safelisted) response headers from JavaScript. Use `origin: true` to reflect the requester, enumerate `methods` (e.g. `['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS']`), and enumerate any non-safelisted response headers you want exposed. `allowHeaders: '*'` is safe — the plugin mirrors `Access-Control-Request-Headers` so `*` never reaches the wire. |
| `maxAge` | `false` | Cache duration for preflight, in seconds. Accepts `string` or `number`. |
| `preflight.continue` | `false` | When `true`, sets preflight headers and forwards to your own `OPTIONS` handler instead of returning 204. |
| `preflight.status` | `204` | Override if a downstream client doesn't tolerate 204. Preflight responses also set `Content-Length: 0` (Safari compat). |

## Common patterns

### Allow-list multiple environments

```typescript
router.use(cors({
    origin: [
        'https://app.example.com',
        /\.staging\.example\.com$/,
    ],
    credentials: true,
}));
```

### Decorate a single route

When you don't want CORS globally:

```typescript
import { handleCors } from '@routup/cors';

router.all('/api/public', defineCoreHandler((event) => {
    const corsResponse = handleCors(event, { origin: '*' });
    if (corsResponse) {
        return corsResponse;
    }

    return loadPayload();
}));
```

## See also

- [Helpers](./helpers) — `handleCors`, `appendCorsHeaders`, `isPreflightRequest`, `isCorsOriginAllowed`
